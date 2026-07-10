import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { getRequestHost } from "@tanstack/react-start/server";

function stableWebhookUrl(secret: string) {
  // Use current request host so preview/prod work seamlessly
  const host = getRequestHost();
  const proto = host.startsWith("localhost") ? "http" : "https";
  const base = `${proto}://${host}`;
  return `${base}/api/public/ggpix/webhook${secret ? `?s=${encodeURIComponent(secret)}` : ""}`;
}

export const createPixIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { amountCents: number; description?: string }) =>
    z.object({
      amountCents: z.number().int().min(100).max(50000000),
      description: z.string().max(140).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { pixIn, loadGatewayConfig } = await import("./gateway.server");

    const { data: profile, error: pErr } = await context.supabase
      .from("profiles")
      .select("phone, name, document, blocked")
      .eq("id", context.userId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!profile) throw new Error("Perfil não encontrado");
    if (profile.blocked) throw new Error("Conta bloqueada. Contate o suporte.");
    if (!profile.document || profile.document.replace(/\D/g, "").length < 11) {
      throw new Error("Cadastre seu CPF no perfil para gerar cobranças PIX.");
    }

    // Limit concurrent pending Pix per user to 5
    const { count: pendingCount } = await supabaseAdmin
      .from("pix_transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .eq("status", "PENDING");
    if ((pendingCount ?? 0) >= 5) {
      throw new Error("Você atingiu o limite de 5 depósitos pendentes. Pague ou cancele algum antes de gerar outro.");
    }

    const cfg = await loadGatewayConfig();
    const externalId = `tx_${crypto.randomUUID()}`;
    const description = data.description?.trim() || `Depósito PIX`;


    const providerRes = await pixIn({
      amountCents: data.amountCents,
      description,
      payerName: profile.name?.trim() || "Cliente",
      payerDocument: profile.document.replace(/\D/g, ""),
      externalId,
      webhookUrl: stableWebhookUrl(cfg.webhookSecret),
      payerPhone: profile.phone,
    });

    const { error: insErr } = await supabaseAdmin.from("pix_transactions").insert({
      user_id: context.userId,
      external_id: externalId,
      provider_id: providerRes.id,
      amount_cents: data.amountCents,
      net_amount_cents: providerRes.fees?.netAmount ?? null,
      fee_cents: providerRes.fees?.total ?? null,
      status: providerRes.status ?? "PENDING",
      description,
      pix_copy_paste: providerRes.pixCopyPaste ?? providerRes.pixCode ?? null,
      raw_response: providerRes,
    });
    if (insErr) throw new Error(insErr.message);

    return {
      id: externalId,
      amountCents: data.amountCents,
      pixCopyPaste: providerRes.pixCopyPaste ?? providerRes.pixCode,
      status: providerRes.status ?? "PENDING",
    };
  });


export const listMyTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("pix_transactions")
      .select("id, external_id, amount_cents, status, description, created_at, paid_at, pix_copy_paste")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { transactions: data ?? [] };
  });

export const listMyPendingPix = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("pix_transactions")
      .select("id, external_id, amount_cents, pix_copy_paste, created_at")
      .eq("user_id", context.userId)
      .eq("status", "PENDING")
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw new Error(error.message);
    return { pending: data ?? [] };
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("phone, name, document, balance_cents, blocked, activated, total_deposited_cents, first_withdrawal_done")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { profile: data };
  });


export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name?: string; document?: string }) =>
    z.object({
      name: z.string().min(1).max(120).optional(),
      document: z.string().max(20).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const update: { name?: string; document?: string } = {};
    if (data.name) update.name = data.name.trim();
    if (data.document) update.document = data.document.replace(/\D/g, "");
    const { error } = await context.supabase.from("profiles").update(update).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
