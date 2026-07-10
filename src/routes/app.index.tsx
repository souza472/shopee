import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile } from "@/lib/pix.functions";
import { getTaskStats } from "@/lib/tasks.functions";
import { ShoppingBag, Wallet, ArrowDownToLine, MessageCircle, UserPlus, FileText, Globe, MapPin, Award } from "lucide-react";

export const Route = createFileRoute("/app/")({ component: AppHome });

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function AppHome() {
  const fetchProfile = useServerFn(getMyProfile);
  const fetchStats = useServerFn(getTaskStats);
  const [profile, setProfile] = useState<{ balance_cents: number; activated?: boolean } | null>(null);
  const [stats, setStats] = useState<{ todayEarnedCents: number; totalEarnedCents: number } | null>(null);

  useEffect(() => {
    fetchProfile().then((r) => setProfile(r.profile as any));
    fetchStats().then(setStats).catch(() => {});
  }, []);

  const shortcuts = [
    { to: "/app/deposit", label: "Recarregar", color: "from-blue-400 to-blue-600", icon: Wallet },
    { to: "/app/withdraw", label: "Retirar", color: "from-slate-400 to-slate-600", icon: ArrowDownToLine },
    { to: "/app/service", label: "Mensagem", color: "from-amber-300 to-orange-500", icon: MessageCircle },
    { to: "/app/profile", label: "Convidar", color: "from-pink-300 to-pink-500", icon: UserPlus },
  ];

  const infoTiles = [
    { label: "Perfil da Companhia", icon: FileText },
    { label: "Descrição das regras", icon: Globe },
    { label: "Cooperação da Agência", icon: MapPin },
    { label: "Qualificação empresarial", icon: Award },
  ];

  const feed = [
    { date: "07-07", amount: 3678 }, { date: "07-07", amount: 5300 },
    { date: "07-07", amount: 4139 }, { date: "07-07", amount: 838 },
    { date: "07-06", amount: 2450 }, { date: "07-06", amount: 1290 },
  ];

  const partners = [
    { name: "mercado livre", bg: "bg-yellow-400", text: "text-black" },
    { name: "shopify", bg: "bg-green-600", text: "text-white" },
    { name: "Walmart", bg: "bg-blue-600", text: "text-white" },
    { name: "Passfeed", bg: "bg-white border", text: "text-red-500" },
    { name: "Bukalapak", bg: "bg-red-600", text: "text-white" },
    { name: "Orami", bg: "bg-pink-200", text: "text-red-600" },
  ];

  return (
    <div className="max-w-md mx-auto">
      <header className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="w-8 h-8 rounded bg-red-500 flex items-center justify-center">
          <ShoppingBag size={18} className="text-white" />
        </div>
        <h1 className="text-lg font-medium">Índice</h1>
        <div className="text-2xl">🇧🇷</div>
      </header>

      <div className="bg-muted/40 flex justify-center py-8">
        <div className="w-40 h-40 rounded-3xl bg-red-500 flex items-center justify-center shadow-xl">
          <ShoppingBag size={90} className="text-white" strokeWidth={1.5} />
        </div>
      </div>

      <div className="px-4 -mt-3">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-5">
          <div className="text-3xl font-bold text-red-500">{profile ? formatBRL(profile.balance_cents) : "R$ 0,00"}</div>
          <div className="text-sm text-muted-foreground mt-1">Meu equilíbrio</div>
          <div className="h-1 bg-primary rounded-full mt-4" />
        </div>
      </div>

      <div className="px-4 mt-5">
        <Link to="/app/tasks" className="block w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-center leading-[3rem] shadow-md">
          Começa a ganhar dinheiro
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-2 px-4 mt-5">
        {shortcuts.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.to} to={s.to} className="flex flex-col items-center gap-1">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-md`}>
                <Icon size={26} className="text-white" />
              </div>
              <span className="text-xs text-foreground/80">{s.label}</span>
            </Link>
          );
        })}
      </div>

      <SectionTitle>Ganhos Totais</SectionTitle>
      <div className="grid grid-cols-2 gap-3 px-4">
        <StatCard value={stats ? formatBRL(stats.todayEarnedCents) : "R$ 0"} label="Ganhos de Hoje" />
        <StatCard value="R$ 0" label="Ganhos de Ontem" />
        <StatCard value={stats ? formatBRL(stats.totalEarnedCents) : "R$ 0"} label="Ganhos Totais" />
        <StatCard value="R$ 0" label="Ganhos da Equipe" />
      </div>

      <div className="grid grid-cols-4 gap-2 px-4 mt-6">
        {infoTiles.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.label} className="flex flex-col items-center gap-1">
              <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center">
                <Icon size={26} className="text-white" />
              </div>
              <div className="w-6 h-0.5 bg-primary/60" />
              <span className="text-xs text-center text-foreground/80 leading-tight">{t.label}</span>
            </div>
          );
        })}
      </div>

      <SectionTitle>Visualização da renda da agência</SectionTitle>
      <div className="px-4 space-y-2">
        {feed.map((f, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-border/60 relative">
            <span className="text-purple-400 text-xl">🔔</span>
            <span className="text-sm">{f.date}</span>
            <div className="ml-auto text-right">
              <div className="text-purple-500 font-medium">{f.amount}</div>
              <div className="text-xs text-muted-foreground">Ganhos de Hoje</div>
            </div>
            <span className="absolute right-0 top-2 bottom-2 w-0.5 bg-purple-300" />
          </div>
        ))}
      </div>

      <SectionTitle>Parceiro cooperativo</SectionTitle>
      <div className="grid grid-cols-3 gap-2 px-4 pb-6">
        {partners.map((p) => (
          <div key={p.name} className={`h-16 rounded-lg ${p.bg} ${p.text} flex items-center justify-center font-bold text-sm`}>
            {p.name}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-4 mt-6 mb-3">
      <span className="w-1 h-4 bg-primary rounded" />
      <h2 className="text-base font-medium">{children}</h2>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 text-center shadow-sm">
      <div className="text-primary font-bold text-lg">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
