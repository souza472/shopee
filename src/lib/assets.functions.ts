import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const ASSET_KEYS = ["logo", "banner_home_1", "banner_home_2", "banner_home_3"] as const;

export const listSiteAssets = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data } = await sb.from("site_assets").select("key, url");
  const map: Record<string, string> = {};
  for (const r of data ?? []) map[r.key] = r.url;
  return { assets: map };
});

export const adminSetSiteAsset = createServerFn({ method: "POST" })
  .inputValidator((d: { key: string; url: string }) =>
    z.object({ key: z.enum(ASSET_KEYS as unknown as [string, ...string[]]), url: z.string().url().max(1000) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { getAdminSession } = await import("@/lib/admin-session.server");
    const s = await getAdminSession();
    if (!s.data.username) throw new Error("Não autorizado");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("site_assets").upsert({ key: data.key, url: data.url, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteSiteAsset = createServerFn({ method: "POST" })
  .inputValidator((d: { key: string }) => z.object({ key: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { getAdminSession } = await import("@/lib/admin-session.server");
    const s = await getAdminSession();
    if (!s.data.username) throw new Error("Não autorizado");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("site_assets").delete().eq("key", data.key);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
