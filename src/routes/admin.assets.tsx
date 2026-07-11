import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listSiteAssets, adminSetSiteAsset, adminDeleteSiteAsset, ASSET_KEYS } from "@/lib/assets.functions";
import { Trash2, Save } from "lucide-react";

export const Route = createFileRoute("/admin/assets")({ component: AssetsPage });

const LABELS: Record<string, string> = {
  logo: "Logo (topo do site)",
  banner_home_1: "Banner Home 1",
  banner_home_2: "Banner Home 2",
  banner_home_3: "Banner Home 3",
};

function AssetsPage() {
  const load = useServerFn(listSiteAssets);
  const save = useServerFn(adminSetSiteAsset);
  const del = useServerFn(adminDeleteSiteAsset);
  const [assets, setAssets] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    const r = await load();
    setAssets(r.assets);
    setDrafts(r.assets);
  }
  useEffect(() => { refresh(); }, []);

  async function onSave(key: string) {
    setMsg(null);
    try {
      await save({ data: { key, url: drafts[key] } });
      setMsg("Salvo!");
      refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Erro"); }
  }
  async function onDelete(key: string) {
    if (!confirm("Remover esta imagem?")) return;
    await del({ data: { key } });
    refresh();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Logo e Banners</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Cole a URL de uma imagem hospedada (ex: imgur, seu CDN). A imagem será exibida no site imediatamente.
      </p>

      <div className="space-y-4">
        {ASSET_KEYS.map((key) => (
          <div key={key} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">{LABELS[key]}</div>
              {assets[key] && (
                <button onClick={() => onDelete(key)} className="text-xs text-red-600 flex items-center gap-1">
                  <Trash2 size={12} /> Remover
                </button>
              )}
            </div>
            {assets[key] && (
              <img src={assets[key]} alt={key} className="max-h-32 rounded border border-border mb-2 bg-muted object-contain" />
            )}
            <div className="flex gap-2">
              <input
                value={drafts[key] ?? ""}
                onChange={(e) => setDrafts({ ...drafts, [key]: e.target.value })}
                placeholder="https://..."
                className="flex-1 h-10 rounded-lg border border-border px-3 text-sm"
              />
              <button onClick={() => onSave(key)}
                className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-1">
                <Save size={14} /> Salvar
              </button>
            </div>
          </div>
        ))}
      </div>

      {msg && <p className="mt-3 text-sm">{msg}</p>}
    </div>
  );
}
