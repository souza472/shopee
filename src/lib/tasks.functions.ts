import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const REWARD_CENTS = 250;

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb.from("products").select("id, title, image_url, price_cents").eq("active", true).limit(20);
  if (error) throw new Error(error.message);
  return { products: data ?? [] };
});

export const completeTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { productId: string }) => z.object({ productId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prof } = await context.supabase
      .from("profiles").select("activated, blocked").eq("id", context.userId).maybeSingle();
    if (!prof) throw new Error("Perfil não encontrado");
    if (prof.blocked) throw new Error("Conta bloqueada");
    if (!prof.activated) throw new Error("Ative sua conta com um depósito de R$ 10 para liberar as tarefas.");
    const { error } = await supabaseAdmin.rpc("complete_task", {
      _user_id: context.userId, _product_id: data.productId, _reward_cents: REWARD_CENTS,
    });
    if (error) throw new Error(error.message);
    return { ok: true, rewardCents: REWARD_CENTS };
  });

export const getTaskStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const { data: today } = await context.supabase
      .from("task_completions").select("id, reward_cents").eq("user_id", context.userId).gte("created_at", start.toISOString());
    const { data: all } = await context.supabase
      .from("task_completions").select("reward_cents").eq("user_id", context.userId);
    return {
      todayCount: today?.length ?? 0,
      todayEarnedCents: (today ?? []).reduce((s, r) => s + Number(r.reward_cents), 0),
      totalEarnedCents: (all ?? []).reduce((s, r) => s + Number(r.reward_cents), 0),
    };
  });
