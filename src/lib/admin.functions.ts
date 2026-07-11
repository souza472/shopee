import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string; password: string }) =>
    z.object({ username: z.string().min(1), password: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data }) => {
    const bcrypt = (await import("bcryptjs")).default;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getAdminSession } = await import("./admin-session.server");

    const { data: admin, error } = await supabaseAdmin
      .from("admin_users")
      .select("username, password_hash")
      .eq("username", data.username)
      .maybeSingle();
   if (error) {
  throw new Error(JSON.stringify(error));
}
    if (!admin) return { ok: false as const, error: "Credenciais inválidas" };
    const ok = await bcrypt.compare(data.password, admin.password_hash);
    if (!ok) return { ok: false as const, error: "Credenciais inválidas" };
    const s = await getAdminSession();
    await s.update({ username: admin.username, loginAt: Date.now() });
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { getAdminSession } = await import("./admin-session.server");
  const s = await getAdminSession();
  await s.clear();
  return { ok: true };
});

export const getAdminMe = createServerFn({ method: "GET" }).handler(async () => {
  const { getAdminSession } = await import("./admin-session.server");
  const s = await getAdminSession();
  return { username: s.data.username ?? null };
});

async function requireAdmin() {
  const { getAdminSession } = await import("./admin-session.server");
  const s = await getAdminSession();
  if (!s.data.username) throw new Error("Não autorizado");
  return s.data.username;
}

export const getGatewaySettings = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { maskSecret, decryptSecret } = await import("./crypto.server");
  const { data } = await supabaseAdmin
    .from("gateway_settings")
    .select("api_key_encrypted, webhook_secret, updated_at")
    .eq("id", 1)
    .maybeSingle();
  let masked = "";
  if (data?.api_key_encrypted) {
    try { masked = maskSecret(decryptSecret(data.api_key_encrypted)); } catch { masked = "•••• (erro ao ler)"; }
  }
  return {
    hasApiKey: !!data?.api_key_encrypted,
    apiKeyMasked: masked,
    webhookSecret: data?.webhook_secret ?? "",
    updatedAt: data?.updated_at ?? null,
  };
});

export const updateGatewaySettings = createServerFn({ method: "POST" })
  .inputValidator((d: { apiKey?: string; webhookSecret?: string }) =>
    z.object({
      apiKey: z.string().min(4).max(500).optional(),
      webhookSecret: z.string().max(200).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { encryptSecret } = await import("./crypto.server");
    const update: { updated_at: string; api_key_encrypted?: string; webhook_secret?: string } = {
      updated_at: new Date().toISOString(),
    };
    if (data.apiKey) update.api_key_encrypted = encryptSecret(data.apiKey);
    if (typeof data.webhookSecret === "string") update.webhook_secret = data.webhookSecret;
    const { error } = await supabaseAdmin.from("gateway_settings").update(update).eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListUsers = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, phone, name, document, balance_cents, blocked, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return { users: data ?? [] };
});

export const adminToggleBlock = createServerFn({ method: "POST" })
  .inputValidator((d: { userId: string; blocked: boolean }) =>
    z.object({ userId: z.string().uuid(), blocked: z.boolean() }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("profiles").update({ blocked: data.blocked }).eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminAdjustBalance = createServerFn({ method: "POST" })
  .inputValidator((d: { userId: string; deltaCents: number }) =>
    z.object({ userId: z.string().uuid(), deltaCents: z.number().int() }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("credit_balance", { _user_id: data.userId, _amount_cents: data.deltaCents });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListTransactions = createServerFn({ method: "GET" })
  .inputValidator((d: { status?: string; search?: string } | undefined) =>
    z.object({ status: z.string().optional(), search: z.string().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("pix_transactions")
      .select("id, user_id, external_id, amount_cents, net_amount_cents, fee_cents, status, description, created_at, paid_at, pix_copy_paste")
      .order("created_at", { ascending: false })
      .limit(500);
    if (data.status) q = q.eq("status", data.status);
    if (data.search) q = q.ilike("external_id", `%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { transactions: rows ?? [] };
  });

export const adminApproveDeposit = createServerFn({ method: "POST" })
  .inputValidator((d: { txId: string }) => z.object({ txId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("admin_credit_deposit", { _tx_id: data.txId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminCancelDeposit = createServerFn({ method: "POST" })
  .inputValidator((d: { txId: string }) => z.object({ txId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("admin_cancel_deposit", { _tx_id: data.txId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListWithdrawals = createServerFn({ method: "GET" })
  .inputValidator((d: { status?: string } | undefined) =>
    z.object({ status: z.string().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("withdrawals")
      .select("id, user_id, amount_cents, fee_cents, net_cents, status, pix_key, pix_key_type, holder_name, holder_document, created_at, processed_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { withdrawals: rows ?? [] };
  });

export const adminFinalizeWithdrawal = createServerFn({ method: "POST" })
  .inputValidator((d: { wdId: string; approve: boolean }) =>
    z.object({ wdId: z.string().uuid(), approve: z.boolean() }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("admin_finalize_withdrawal", { _wd_id: data.wdId, _approve: data.approve });
    if (error) throw new Error(error.message);
    return { ok: true };
  });


export const adminDashboard = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ count: users }, { count: pending }, { data: totals }] = await Promise.all([
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("pix_transactions").select("id", { count: "exact", head: true }).eq("status", "PENDING"),
    supabaseAdmin.from("pix_transactions").select("status, amount_cents, fee_cents"),
  ]);
  let completedCents = 0, feesCents = 0, completedCount = 0;
  for (const t of totals ?? []) {
    if (t.status === "COMPLETE") {
      completedCents += Number(t.amount_cents ?? 0);
      feesCents += Number(t.fee_cents ?? 0);
      completedCount++;
    }
  }
  return {
    users: users ?? 0,
    pendingCount: pending ?? 0,
    completedCount,
    completedCents,
    feesCents,
  };
});
