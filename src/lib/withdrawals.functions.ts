import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const MIN_WITHDRAW_CENTS = 2000;
export const WITHDRAW_FEE_CENTS = 150;

export const requestWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { amountCents: number; pixKeyType: string; pixKey: string; holderName: string; holderDocument: string }) =>
    z.object({
      amountCents: z.number().int().min(MIN_WITHDRAW_CENTS),
      pixKeyType: z.enum(["CPF", "CNPJ", "EMAIL", "PHONE", "RANDOM"]),
      pixKey: z.string().min(3).max(200),
      holderName: z.string().min(2).max(120),
      holderDocument: z.string().min(11).max(20),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prof, error: pErr } = await context.supabase
      .from("profiles")
      .select("balance_cents, blocked, activated, vip_level, vip_at_last_withdrawal")
      .eq("id", context.userId).maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!prof) throw new Error("Perfil não encontrado");
    if (prof.blocked) throw new Error("Conta bloqueada");
    if (!prof.activated) throw new Error("Ative sua conta para sacar");
    const currentVip = (prof as any).vip_level ?? 0;
    const lastVip = (prof as any).vip_at_last_withdrawal ?? -1;
    if (currentVip <= lastVip) {
      throw new Error(`Para sacar novamente você precisa fazer upgrade para VIP ${lastVip + 1}. Faça um depósito para subir de nível.`);
    }
    if (data.amountCents < MIN_WITHDRAW_CENTS) throw new Error("Saque mínimo R$ 20,00");
    const fee = WITHDRAW_FEE_CENTS;
    const totalDebit = data.amountCents + fee;
    if (prof.balance_cents < totalDebit) throw new Error(`Saldo insuficiente. Necessário R$ ${(totalDebit/100).toFixed(2)} (inclui taxa de R$ ${(fee/100).toFixed(2)}).`);
    const { error: insErr } = await supabaseAdmin.from("withdrawals").insert({
      user_id: context.userId,
      amount_cents: data.amountCents,
      fee_cents: fee,
      net_cents: data.amountCents,
      pix_key_type: data.pixKeyType,
      pix_key: data.pixKey,
      holder_name: data.holderName,
      holder_document: data.holderDocument.replace(/\D/g, ""),
      status: "PENDING",
    });
    if (insErr) throw new Error(insErr.message);
    await supabaseAdmin.from("profiles").update({
      balance_cents: prof.balance_cents - totalDebit,
      first_withdrawal_done: true,
      vip_at_last_withdrawal: currentVip,
    }).eq("id", context.userId);
    return { ok: true, fee };
  });

export const listMyWithdrawals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("withdrawals").select("id, amount_cents, fee_cents, net_cents, status, created_at, pix_key")
      .eq("user_id", context.userId).order("created_at", { ascending: false }).limit(50);
    if (error) throw new Error(error.message);
    return { withdrawals: data ?? [] };
  });
