import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile } from "@/lib/pix.functions";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, ShoppingBag, DollarSign, ArrowDownToLine, MessageCircle, Users, FileText, ClipboardList, ListChecks, CreditCard, Lock, Power } from "lucide-react";

export const Route = createFileRoute("/app/profile")({ component: ProfilePage });

function ProfilePage() {
  const nav = useNavigate();
  const fetchProfile = useServerFn(getMyProfile);
  const [p, setP] = useState<any>(null);
  useEffect(() => { fetchProfile().then((r) => setP(r.profile)); }, []);

  const items = [
    { icon: DollarSign, label: "recarregar", to: "/app/deposit" },
    { icon: ArrowDownToLine, label: "Retirar", to: "/app/withdraw" },
    { icon: MessageCircle, label: "Mensagem", to: "/app/service" },
    { icon: Users, label: "Relatório de equipe", to: "/app/profile" },
    { icon: FileText, label: "Registros de recarga", to: "/app/history" },
    { icon: ClipboardList, label: "Registro de remoção", to: "/app/history" },
    { icon: ListChecks, label: "Detalles da Conta", to: "/app/history" },
    { icon: CreditCard, label: "Alterar banco de retirada", to: "/app/bank" },
    { icon: Lock, label: "Alterar a senha", to: "/app/profile" },
  ];

  async function logout() { await supabase.auth.signOut(); nav({ to: "/" }); }

  return (
    <div className="max-w-md mx-auto">
      <div className="p-4 text-white" style={{ background: "linear-gradient(135deg, oklch(0.72 0.18 45), oklch(0.65 0.2 40))" }}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center">
            <ShoppingBag size={30} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="text-xl font-semibold">{p?.phone ?? "..."}</div>
            <div className="text-xs">Código de promoção: {p?.promo_code ?? "----"}</div>
            <div className="text-xs">crédito: {p?.activated ? "100" : "0"}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 mt-5 text-center">
          <div><div className="text-lg font-bold">R$ {p ? (p.balance_cents/100).toFixed(2) : "0,00"}</div><div className="text-xs">ativos totais</div></div>
          <div><div className="text-lg font-bold">R$ {p ? ((p.total_earned_cents ?? 0)/100).toFixed(2) : "0"}</div><div className="text-xs">Ganhos Totais</div></div>
          <div><div className="text-lg font-bold">R$ 0,00</div><div className="text-xs">Congele</div></div>
        </div>
      </div>

      <div className="bg-card rounded-t-2xl -mt-4 pt-2">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Link key={it.label} to={it.to} className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Icon size={22} className="text-primary" />
              <span className="flex-1">{it.label}</span>
              <ChevronRight size={18} className="text-muted-foreground" />
            </Link>
          );
        })}
        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3">
          <Power size={22} className="text-primary" />
          <span className="flex-1 text-left">Sair</span>
          <ChevronRight size={18} className="text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
