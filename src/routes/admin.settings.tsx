import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getGatewaySettings, updateGatewaySettings } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const load = useServerFn(getGatewaySettings);
  const save = useServerFn(updateGatewaySettings);
  const [info, setInfo] = useState<{ hasApiKey: boolean; apiKeyMasked: string; webhookSecret: string; updatedAt: string | null } | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const webhookUrl = typeof window !== "undefined" ? `${window.location.origin}/api/public/ggpix/webhook` : "";

  useEffect(() => { load().then((r) => { setInfo(r); setWebhookSecret(r.webhookSecret); }); }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault(); setMsg(null); setSaving(true);
    try {
      await save({ data: { apiKey: apiKey || undefined, webhookSecret } });
      setApiKey("");
      const r = await load(); setInfo(r);
      setMsg("Salvo com sucesso.");
    } catch (e) { setMsg(e instanceof Error ? e.message : "Erro"); }
    finally { setSaving(false); }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Configurações do Gateway GGPIXAPI</h1>

      <div className="bg-card border border-border rounded-xl p-4 mb-4 text-sm">
        <p className="font-semibold mb-1">URL do webhook para configurar no painel da GGPIXAPI:</p>
        <code className="block break-all bg-muted rounded p-2 text-xs">{webhookUrl}{webhookSecret ? `?s=${encodeURIComponent(webhookSecret)}` : ""}</code>
        <p className="mt-2 text-xs text-muted-foreground">Envie também o segredo abaixo como <code>?s=</code> na URL — usamos para validar cada webhook recebido.</p>
      </div>

      <form onSubmit={onSave} className="bg-card border border-border rounded-xl p-4 space-y-4">
        <div>
          <label className="text-sm font-medium">X-API-Key GGPIXAPI</label>
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={info?.hasApiKey ? `Atual: ${info.apiKeyMasked} — cole nova para trocar` : "Cole sua API Key"}
            className="mt-1 w-full h-11 rounded-lg border border-border px-3 font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">Armazenada criptografada (AES-256-GCM). Nunca sai do servidor em claro.</p>
        </div>

        <div>
          <label className="text-sm font-medium">Segredo do webhook</label>
          <input
            value={webhookSecret}
            onChange={(e) => setWebhookSecret(e.target.value)}
            placeholder="ex: um token aleatório longo"
            className="mt-1 w-full h-11 rounded-lg border border-border px-3 font-mono text-sm"
          />
        </div>

        <button disabled={saving} className="h-11 px-5 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-60">
          {saving ? "Salvando..." : "Salvar"}
        </button>
        {msg && <p className="text-sm">{msg}</p>}
        {info?.updatedAt && <p className="text-xs text-muted-foreground">Atualizado em {new Date(info.updatedAt).toLocaleString("pt-BR")}</p>}
      </form>
    </div>
  );
}
