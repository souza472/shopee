import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminDashboard } from "@/lib/admin.functions";
import { Users, Clock, CheckCircle, DollarSign } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: DashPage,
});

function formatBRL(cents: number) { return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

function DashPage() {
  const load = useServerFn(adminDashboard);
  const [d, setD] = useState<{ users: number; pendingCount: number; completedCount: number; completedCents: number; feesCents: number } | null>(null);
  useEffect(() => { load().then(setD); }, []);
  const cards = d ? [
    { label: "Usuários", value: d.users, icon: Users },
    { label: "PIX pendentes", value: d.pendingCount, icon: Clock },
    { label: "PIX confirmados", value: d.completedCount, icon: CheckCircle },
    { label: "Total recebido", value: formatBRL(d.completedCents), icon: DollarSign },
    { label: "Taxas pagas", value: formatBRL(d.feesCents), icon: DollarSign },
  ] : [];
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between text-muted-foreground text-sm">
                <span>{c.label}</span><Icon size={16} />
              </div>
              <div className="text-2xl font-bold mt-1">{c.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
