import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { decryptSecret } from "./crypto.server";

const BASE = "https://ggatepixapi.com/api/v1";

export async function loadGatewayConfig() {
  const { data, error } = await supabaseAdmin
    .from("gateway_settings")
    .select("api_key_encrypted, webhook_secret")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  if (!data?.api_key_encrypted) throw new Error("Gateway não configurado. Peça ao admin para configurar a API Key.");
  const apiKey = decryptSecret(data.api_key_encrypted);
  return { apiKey, webhookSecret: data.webhook_secret ?? "" };
}

export type PixInPayload = {
  amountCents: number;
  description: string;
  payerName: string;
  payerDocument: string;
  externalId: string;
  webhookUrl?: string;
  payerEmail?: string;
  payerPhone?: string;
};

export async function pixIn(payload: PixInPayload) {
  const { apiKey } = await loadGatewayConfig();
  const res = await fetch(`${BASE}/pix/in`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* noop */ }
  if (!res.ok) {
    throw new Error(`GGPIXAPI ${res.status}: ${json?.message ?? json?.error ?? text.slice(0, 200)}`);
  }
  return json;
}
