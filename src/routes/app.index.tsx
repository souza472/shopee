import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile } from "@/lib/pix.functions";
import { getTaskStats } from "@/lib/tasks.functions";
import { getMyVipStatus, listVipTiers } from "@/lib/vip.functions";
import { doCheckin } from "@/lib/checkin.functions";
import { listSiteAssets } from "@/lib/assets.functions";
import { BrandLogo } from "@/components/BrandLogo";
import { BannerCarousel } from "@/components/BannerCarousel";
import { Skeleton } from "@/components/Skeleton";
import { Wallet, ArrowDownToLine, MessageCircle, UserPlus, Gift, Crown } from "lucide-react";
import banner1 from "@/assets/banner-1.jpg";
import banner2 from "@/assets/banner-2.jpg";
import banner3 from "@/assets/banner-3.jpg";

export const Route = createFileRoute("/app/")({ component: AppHome });

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}


function AppHome() {
  const fetchProfile = useServerFn(getMyProfile);
  const fetchStats = useServerFn(getTaskStats);
  const fetchVip = useServerFn(getMyVipStatus);
  const fetchTiers = useServerFn(listVipTiers);
  const fetchAssets = useServerFn(listSiteAssets);
  const doCheck = useServerFn(doCheckin);

  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<{ todayEarnedCents: number; totalEarnedCents: number } | null>(null);
  const [vip, setVip] = useState<any>(null);
  const [tiers, setTiers] = useState<any[]>([]);
  const [assets, setAssets] = useState<Record<string, string>>({});
  const [checkMsg, setCheckMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchProfile().then((r) => setProfile(r.profile));
    fetchStats().then(setStats).catch(() => {});
    fetchVip().then(setVip).catch(() => {});
    fetchTiers().then((r) => setTiers(r.tiers));
    fetchAssets().then((r) => setAssets(r.assets));
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const canCheckin = profile && profile.last_checkin_date !== today;

  async function onCheckin() {
    setCheckMsg(null); setBusy(true);
    try {
      const r = await doCheck();
      setCheckMsg(`+ R$ ${(r.amountCents / 100).toFixed(2)} creditado!`);
      fetchProfile().then((p) => setProfile(p.profile));
    } catch (e) { setCheckMsg(e instanceof Error ? e.message : "Erro"); }
    finally { setBusy(false); }
  }

  const currentTier = tiers.find((t) => t.level === (profile?.vip_level ?? 0));
  const nextTier = tiers.find((t) => t.level === (profile?.vip_level ?? 0) + 1);

  const shortcuts = [
    { to: "/app/deposit", label: "Recarregar", color: "from-blue-400 to-blue-600", icon: Wallet },
    { to: "/app/withdraw", label: "Retirar", color: "from-slate-400 to-slate-600", icon: ArrowDownToLine },
    { to: "/app/service", label: "Mensagem", color: "from-amber-300 to-orange-500", icon: MessageCircle },
    { to: "/app/profile", label: "Convidar", color: "from-pink-300 to-pink-500", icon: UserPlus },
  ];

  const banners = [assets.banner_home_1 || banner1, assets.banner_home_2 || banner2, assets.banner_home_3 || banner3].filter(Boolean);

  return (
    <div className="max-w-md mx-auto pb-4">
      <header className="flex items-center justify-between px-4 pt-3 pb-2 sticky top-0 bg-background/95 backdrop-blur z-30">
        {assets.logo ? (
          <img src={assets.logo} alt="Shopee" className="h-9 w-auto" />
        ) : (
          <BrandLogo size={36} />
        )}
        <h1 className="text-lg font-bold" style={{ color: "#EE4D2D" }}>Shopee</h1>
        <div className="text-2xl">🇧🇷</div>
      </header>

      <BannerCarousel images={banners} />


      <div className="px-4 -mt-1">
        <div className="rounded-2xl shadow-lg p-5 text-white relative overflow-hidden" style={{ background: "var(--gradient-shopee)" }}>
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -right-4 top-16 w-24 h-24 rounded-full bg-white/10" />
          {profile ? (
            <div className="text-3xl font-extrabold tracking-tight relative">{formatBRL(profile.balance_cents)}</div>
          ) : (
            <Skeleton className="h-8 w-32 bg-white/30" />
          )}
          <div className="text-sm text-white/90 mt-1 relative">Meu saldo</div>
          <div className="mt-3 flex items-center gap-2 text-sm relative">
            <Crown size={16} className="text-yellow-200" />
            <span className="font-semibold">{currentTier?.name ?? "Free"}</span>
            <span className="text-white/80">· {currentTier?.daily_tasks ?? 5} tarefas/dia</span>
          </div>
          {nextTier && (
            <div className="mt-2 relative">
              <div className="text-xs text-white/85">
                Próximo: {nextTier.name} — falta R$ {Math.max(0, (nextTier.min_deposited_cents - (profile?.total_deposited_cents ?? 0)) / 100).toFixed(2)}
              </div>
              <div className="h-1.5 bg-white/25 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-white transition-all" style={{
                  width: `${Math.min(100, ((profile?.total_deposited_cents ?? 0) / nextTier.min_deposited_cents) * 100)}%`
                }} />
              </div>
            </div>
          )}
        </div>
      </div>


      <div className="px-4 mt-4">
        <button onClick={onCheckin} disabled={!canCheckin || busy}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold shadow-md disabled:opacity-60 flex items-center justify-center gap-2 active:scale-95 transition-transform">
          <Gift size={22} />
          {canCheckin
            ? `Check-in diário: +R$ ${((currentTier?.checkin_bonus_cents ?? 50) / 100).toFixed(2)}`
            : "Check-in de hoje realizado ✓"}
        </button>
        {checkMsg && <p className="mt-2 text-sm text-center text-primary">{checkMsg}</p>}
      </div>

      <div className="px-4 mt-4">
        <Link to="/app/tasks" className="block w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-center leading-[3rem] shadow-md">
          Começa a ganhar dinheiro
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-2 px-4 mt-5">
        {shortcuts.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.to} to={s.to} className="flex flex-col items-center gap-1 active:scale-95 transition-transform">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-md`}>
                <Icon size={26} className="text-white" />
              </div>
              <span className="text-xs text-foreground/80">{s.label}</span>
            </Link>
          );
        })}
      </div>

      <SectionTitle>Ganhos</SectionTitle>
      <div className="grid grid-cols-2 gap-3 px-4">
        <StatCard value={stats ? formatBRL(stats.todayEarnedCents) : "R$ 0"} label="Ganhos de Hoje" />
        <StatCard value={`${vip?.todayTasks ?? 0}/${currentTier?.daily_tasks ?? 5}`} label="Tarefas hoje" />
        <StatCard value={stats ? formatBRL(stats.totalEarnedCents) : "R$ 0"} label="Ganhos Totais" />
        <StatCard value={profile ? formatBRL(profile.total_deposited_cents ?? 0) : "R$ 0"} label="Depositado" />
      </div>

      <SectionTitle>Níveis VIP</SectionTitle>
      <div className="px-4 space-y-2 pb-6">
        {tiers.map((t) => {
          const isCurrent = t.level === (profile?.vip_level ?? 0);
          return (
            <div key={t.level} className={`p-3 rounded-xl border ${isCurrent ? "border-primary bg-primary/5" : "border-border bg-card"} flex items-center justify-between`}>
              <div>
                <div className="font-semibold flex items-center gap-1">
                  <Crown size={14} className={isCurrent ? "text-amber-500" : "text-muted-foreground"} />
                  {t.name}
                </div>
                <div className="text-xs text-muted-foreground">Depósito acumulado ≥ R$ {(t.min_deposited_cents / 100).toFixed(0)}</div>
              </div>
              <div className="text-right text-sm">
                <div className="font-bold text-primary">{t.daily_tasks} tarefas/dia</div>
                <div className="text-xs text-muted-foreground">Check-in R$ {(t.checkin_bonus_cents / 100).toFixed(2)}</div>
              </div>
            </div>
          );
        })}
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
