import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminListUsers, adminToggleBlock, adminAdjustBalance } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/users")({
  component: UsersPage,
});

type U = { id: string; phone: string; name: string | null; document: string | null; balance_cents: number; blocked: boolean; created_at: string };
function formatBRL(cents: number) { return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

function UsersPage() {
  const list = useServerFn(adminListUsers);
  const toggle = useServerFn(adminToggleBlock);
  const adjust = useServerFn(adminAdjustBalance);
  const [users, setUsers] = useState<U[]>([]);
  const [q, setQ] = useState("");

  async function refresh() { const r = await list(); setUsers(r.users as U[]); }
  useEffect(() => { refresh(); }, []);

  async function onAdjust(u: U) {
    const raw = prompt(`Ajuste de saldo para ${u.name ?? u.phone} (em R$, use negativo para debitar):`, "10,00");
    if (!raw) return;
    const cents = Math.round(parseFloat(raw.replace(",", ".")) * 100);
    if (!Number.isFinite(cents)) return;
    await adjust({ data: { userId: u.id, deltaCents: cents } });
    refresh();
  }

  const filtered = users.filter((u) => (u.phone + (u.name ?? "") + (u.document ?? "")).toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Usuários</h1>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por telefone, nome ou CPF" className="w-full max-w-md h-10 rounded-lg border border-border px-3 mb-4" />
      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="p-2">Nome</th><th className="p-2">Telefone</th><th className="p-2">CPF</th><th className="p-2">Saldo</th><th className="p-2">Status</th><th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="p-2">{u.name ?? "-"}</td>
                <td className="p-2">+55 {u.phone}</td>
                <td className="p-2 font-mono text-xs">{u.document ?? "-"}</td>
                <td className="p-2 font-semibold">{formatBRL(u.balance_cents)}</td>
                <td className="p-2">{u.blocked ? <span className="text-red-600">Bloqueado</span> : <span className="text-green-600">Ativo</span>}</td>
                <td className="p-2 flex gap-2">
                  <button onClick={async () => { await toggle({ data: { userId: u.id, blocked: !u.blocked } }); refresh(); }} className="text-xs px-2 py-1 rounded bg-secondary">
                    {u.blocked ? "Desbloquear" : "Bloquear"}
                  </button>
                  <button onClick={() => onAdjust(u)} className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground">Ajustar saldo</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Nenhum usuário.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
