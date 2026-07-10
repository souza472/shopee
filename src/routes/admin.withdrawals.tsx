import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminListWithdrawals, adminFinalizeWithdrawal } from "@/lib/admin.functions";
import { StatusBadge } from "@/components/StatusBadge";
import { Check, X } from "lucide-react";

export const Route = createFileRoute("/admin/withdrawals")({
  component: WdPage,
});

type W = {
  id: string; user_id: string; amount_cents: number; fee_cents: number; net_cents: number;
  status: string; pix_key: string; pix_key_type: string; holder_name: string; holder_document: string;
  created_at: string; processed_at: string | null;
};

function fmt(c: number) {
  return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function WdPage() {
  const list = useServerFn(adminListWithdrawals);
  const finalize = useServerFn(adminFinalizeWithdrawal);
  const [rows, setRows] = useState<W[]>([]);
  const [status, setStatus] = useState("");

  async function refresh() {
    const r = await list({ data: { status: status || undefined } });
    setRows(r.withdrawals as W[]);
  }
  useEffect(() => { refresh(); }, [status]);

  async function act(w: W, approve: boolean) {
    const msg = approve
      ? `Aprovar saque de ${fmt(w.amount_cents)} para ${w.holder_name}? Marque como pago apenas após transferir o Pix.`
      : `Rejeitar saque? O valor (${fmt(w.amount_cents + w.fee_cents)}) volta para o saldo do usuário.`;
    if (!confirm(msg)) return;
    await finalize({ data: { wdId: w.id, approve } });
    refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Saques</h1>
      <div className="flex gap-2 mb-4">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-lg border border-border px-2">
          <option value="">Todos</option>
          <option value="PENDING">Pendente</option>
          <option value="COMPLETED">Concluído</option>
          <option value="FAILED">Rejeitado</option>
        </select>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="p-2">Data</th>
              <th className="p-2">Titular</th>
              <th className="p-2">Chave Pix</th>
              <th className="p-2">Valor</th>
              <th className="p-2">Taxa</th>
              <th className="p-2">Status</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.id} className="border-t border-border">
                <td className="p-2 whitespace-nowrap">{new Date(w.created_at).toLocaleString("pt-BR")}</td>
                <td className="p-2">
                  <div>{w.holder_name}</div>
                  <div className="text-xs font-mono text-muted-foreground">{w.holder_document}</div>
                </td>
                <td className="p-2 font-mono text-xs">
                  <div>{w.pix_key_type}</div>
                  <div>{w.pix_key}</div>
                </td>
                <td className="p-2 font-semibold">{fmt(w.amount_cents)}</td>
                <td className="p-2">{fmt(w.fee_cents)}</td>
                <td className="p-2"><StatusBadge status={w.status} /></td>
                <td className="p-2 flex gap-1">
                  {w.status === "PENDING" && (
                    <>
                      <button onClick={() => act(w, true)} className="text-xs px-2 py-1 rounded bg-emerald-500 text-white flex items-center gap-1">
                        <Check size={12} /> Aprovar
                      </button>
                      <button onClick={() => act(w, false)} className="text-xs px-2 py-1 rounded bg-red-500 text-white flex items-center gap-1">
                        <X size={12} /> Rejeitar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">Nenhum saque.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Rejeitar devolve o valor + taxa ao saldo do usuário e reseta o marcador de primeiro saque.
      </p>
    </div>
  );
}
