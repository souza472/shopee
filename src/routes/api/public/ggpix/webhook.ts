import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/ggpix/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const url = new URL(request.url);
        const providedSecret = url.searchParams.get("s") ?? request.headers.get("x-webhook-secret") ?? "";

        const { data: cfg } = await supabaseAdmin
          .from("gateway_settings")
          .select("webhook_secret")
          .eq("id", 1)
          .maybeSingle();
        const expected = cfg?.webhook_secret ?? "";
        if (expected && providedSecret !== expected) {
          return new Response("Invalid webhook secret", { status: 401 });
        }

        let payload: any;
        try { payload = await request.json(); } catch { return new Response("Bad JSON", { status: 400 }); }

        const externalId: string | undefined = payload.externalId;
        const status: string | undefined = payload.status;
        const netAmount: number | undefined = payload.netAmount;
        const gatewayFee: number | undefined = payload.gatewayFee;
        const paidAt: string | undefined = payload.paidAt;

        if (!externalId) return new Response("Missing externalId", { status: 400 });

        const { data: tx, error: findErr } = await supabaseAdmin
          .from("pix_transactions")
          .select("id, user_id, status, amount_cents")
          .eq("external_id", externalId)
          .maybeSingle();
        if (findErr) return new Response(findErr.message, { status: 500 });

        await supabaseAdmin.from("webhook_events").insert({
          transaction_id: tx?.id ?? null,
          external_id: externalId,
          payload,
        });

        if (!tx) return new Response("Transaction not found (event stored)", { status: 202 });

        if (status === "COMPLETE" && tx.status !== "COMPLETE") {
          const { error: uErr } = await supabaseAdmin
            .from("pix_transactions")
            .update({
              status: "COMPLETE",
              net_amount_cents: netAmount ?? null,
              fee_cents: gatewayFee ?? null,
              paid_at: paidAt ?? new Date().toISOString(),
            })
            .eq("id", tx.id);
          if (uErr) return new Response(uErr.message, { status: 500 });
          const creditAmount = netAmount ?? tx.amount_cents;
          await supabaseAdmin.rpc("credit_balance", { _user_id: tx.user_id, _amount_cents: creditAmount });
          // Track total deposited and activate account if threshold reached
          const { data: prof } = await supabaseAdmin
            .from("profiles").select("total_deposited_cents").eq("id", tx.user_id).maybeSingle();
          await supabaseAdmin.from("profiles").update({
            total_deposited_cents: (prof?.total_deposited_cents ?? 0) + tx.amount_cents,
          }).eq("id", tx.user_id);
          await supabaseAdmin.rpc("maybe_activate", { _user_id: tx.user_id });
        } else if (status && status !== tx.status) {
          await supabaseAdmin.from("pix_transactions").update({ status }).eq("id", tx.id);
        }

        return new Response("ok");
      },
    },
  },
});
