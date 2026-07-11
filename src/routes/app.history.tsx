import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listMyTransactions } from "@/lib/pix.functions";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/app/history")({
  component: HistoryPage,
});

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function HistoryPage() {
  const listTx = useServerFn(listMyTransactions);
  const [txs, setTxs] = useState<Array<{ id: string; external_id: string; amount_cents: number; status: string; description: string | null; created_at: string }>>([]);
  useEffect(() => { listTx().then((r) => setTxs(r.transactions)); }, []);
  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-lg font-semibold mb-3">Histórico</h1>
      <div className="bg-card border border-border rounded-2xl divide-y divide-border">
        {txs.length === 0 && <p className="p-4 text-sm text-muted-foreground">Sem transações.</p>}
        {txs.map((t) => (
          <div key={t.id} className="p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{formatBRL(t.amount_cents)}</div>
              <div className="text-xs text-muted-foreground">{t.description ?? "Depósito"}</div>
              <div className="text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleString("pt-BR")}</div>
            </div>
            <StatusBadge status={t.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
