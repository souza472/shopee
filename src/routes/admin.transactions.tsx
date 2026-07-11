import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminListTransactions, adminApproveDeposit, adminCancelDeposit } from "@/lib/admin.functions";
import { StatusBadge } from "@/components/StatusBadge";
import QRCode from "qrcode";
import { Check, X, QrCode, Copy } from "lucide-react";

export const Route = createFileRoute("/admin/transactions")({
  component: TxPage,
});

type T = {
  id: string; user_id: string; external_id: string; amount_cents: number;
  net_amount_cents: number | null; fee_cents: number | null; status: string;
  description: string | null; created_at: string; paid_at: string | null;
  pix_copy_paste: string | null;
};

function formatBRL(cents: number | null) {
  if (cents == null) return "-";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function TxPage() {
  const list = useServerFn(adminListTransactions);
  const approve = useServerFn(adminApproveDeposit);
  const cancel = useServerFn(adminCancelDeposit);
  const [txs, setTxs] = useState<T[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ tx: T; qr: string } | null>(null);

  async function refresh() {
    const r = await list({ data: { status: status || undefined, search: search || undefined } });
    setTxs(r.transactions as T[]);
  }
  useEffect(() => { refresh(); }, [status]);

  async function openPix(tx: T) {
    if (!tx.pix_copy_paste) return alert("Sem código Pix salvo para essa transação.");
    const qr = await QRCode.toDataURL(tx.pix_copy_paste, { width: 260, margin: 1 });
    setModal({ tx, qr });
  }

  async function onApprove(tx: T) {
    if (!confirm(`Aprovar depósito de ${formatBRL(tx.amount_cents)}? O saldo do usuário será creditado.`)) return;
    await approve({ data: { txId: tx.id } });
    refresh();
  }
  async function onCancel(tx: T) {
    if (!confirm("Cancelar este Pix pendente?")) return;
    await cancel({ data: { txId: tx.id } });
    refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Depósitos SHOPEE</h1>
      <div className="flex gap-2 mb-4 flex-wrap">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-lg border border-border px-2">
          <option value="">Todos os status</option>
          <option value="PENDING">Pendente</option>
          <option value="COMPLETE">Confirmado</option>
          <option value="FAILED">Falhou</option>
          <option value="CANCELED">Cancelado</option>
        </select>
        <form onSubmit={(e) => { e.preventDefault(); refresh(); }} className="flex-1 flex gap-2 min-w-[240px]">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por externalId" className="flex-1 h-10 rounded-lg border border-border px-3" />
          <button className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Buscar</button>
        </form>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="p-2">Data</th>
              <th className="p-2">ExternalId</th>
              <th className="p-2">Valor</th>
              <th className="p-2">Status</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {txs.map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="p-2 whitespace-nowrap">{new Date(t.created_at).toLocaleString("pt-BR")}</td>
                <td className="p-2 font-mono text-xs">{t.external_id}</td>
                <td className="p-2">{formatBRL(t.amount_cents)}</td>
                <td className="p-2"><StatusBadge status={t.status} /></td>
                <td className="p-2 flex gap-1 flex-wrap">
                  {t.pix_copy_paste && (
                    <button onClick={() => openPix(t)} className="text-xs px-2 py-1 rounded bg-secondary flex items-center gap-1">
                      <QrCode size={12} /> Ver Pix
                    </button>
                  )}
                  {t.status === "PENDING" && (
                    <>
                      <button onClick={() => onApprove(t)} className="text-xs px-2 py-1 rounded bg-emerald-500 text-white flex items-center gap-1">
                        <Check size={12} /> Aprovar
                      </button>
                      <button onClick={() => onCancel(t)} className="text-xs px-2 py-1 rounded bg-red-500 text-white flex items-center gap-1">
                        <X size={12} /> Cancelar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {txs.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Nenhum depósito.</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setModal(null)}>
          <div className="bg-card rounded-2xl p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Pix pendente</h3>
              <button onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <div className="text-center text-2xl font-bold text-emerald-600 mb-3">
              {formatBRL(modal.tx.amount_cents)}
            </div>
            <img src={modal.qr} alt="QR" className="mx-auto rounded-lg border" />
            <textarea readOnly value={modal.tx.pix_copy_paste ?? ""} className="w-full mt-3 h-20 text-xs p-2 border border-border rounded font-mono break-all" />
            <button
              onClick={() => { navigator.clipboard.writeText(modal.tx.pix_copy_paste ?? ""); }}
              className="w-full mt-2 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Copy size={14} /> Copiar código
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
