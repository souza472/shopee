import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listVipTiers = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data } = await sb.from("vip_tiers").select("level, name, min_deposited_cents, daily_tasks, checkin_bonus_cents").order("level");
  return { tiers: data ?? [] };
});

export const getMyVipStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: prof } = await context.supabase
      .from("profiles").select("vip_level, total_deposited_cents, vip_at_last_withdrawal, last_deposit_notified_id, last_checkin_date")
      .eq("id", context.userId).maybeSingle();
    const start = new Date(); start.setUTCHours(0, 0, 0, 0);
    const { count } = await context.supabase
      .from("task_completions").select("id", { count: "exact", head: true })
      .eq("user_id", context.userId).gte("created_at", start.toISOString());
    return { profile: prof, todayTasks: count ?? 0 };
  });
