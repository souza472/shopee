import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile } from "@/lib/pix.functions";
import { getTaskStats, listProducts, completeTask } from "@/lib/tasks.functions";
import { Plus, Heart, Star } from "lucide-react";

export const Route = createFileRoute("/app/tasks")({ component: TasksPage });

function fmt(c: number) { return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

function TasksPage() {
  const fetchProfile = useServerFn(getMyProfile);
  const fetchStats = useServerFn(getTaskStats);
  const fetchProducts = useServerFn(listProducts);
  const doTask = useServerFn(completeTask);

  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [products, setProducts] = useState<Array<{ id: string; title: string; image_url: string; price_cents: number }>>([]);
  const [current, setCurrent] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    const [p, s, pr] = await Promise.all([fetchProfile(), fetchStats(), fetchProducts()]);
    setProfile(p.profile); setStats(s); setProducts(pr.products);
  }
  useEffect(() => { reload(); }, []);
  useEffect(() => {
    if (profile?.activated) return;
    const t = setInterval(() => { fetchProfile().then((p) => setProfile(p.profile)); }, 5000);
    return () => clearInterval(t);
  }, [profile?.activated]);


  async function like() {
    if (!products[current]) return;
    setMsg(null); setBusy(true);
    try {
      await doTask({ data: { productId: products[current].id } });
      setMsg("+ R$ 2,50 creditado!");
      setCurrent((c) => (c + 1) % products.length);
      reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro");
    } finally { setBusy(false); }
  }

  const activated = profile?.activated;
  const p = products[current];

  return (
    <div className="max-w-md mx-auto">
      <header className="flex items-center justify-center px-4 pt-3 pb-2 relative">
        <h1 className="text-lg font-medium">Shopee</h1>
        <span className="absolute right-4 text-blue-500">💬</span>
      </header>

      <div className="px-4">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-primary">{profile ? fmt(profile.balance_cents) : "R$ 0,00"}</div>
            <div className="text-sm text-muted-foreground">Meu equilíbrio</div>
          </div>
          <Link to="/app/deposit" className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shadow">
            <Plus size={24} />
          </Link>
        </div>
        <div className="h-1 bg-primary rounded-full mt-2" />
      </div>

      <div className="mx-4 mt-4 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden" style={{ background: "var(--gradient-shopee)" }}>
        <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10" />
        <div className="flex items-center gap-3 relative">
          <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center">👑</div>
          <div>
            <div className="font-semibold">Nível de membro Free</div>
            <div className="text-xs text-white/85">comissão: 5.0% | {stats?.todayCount ?? 0} Tarefa</div>
          </div>
        </div>
        <div className="grid grid-cols-3 mt-4 text-center relative">
          <div><div className="text-2xl font-bold">{stats?.todayCount ?? 0}</div><div className="text-xs text-white/85">Concluído</div></div>
          <div><div className="text-2xl font-bold">5</div><div className="text-xs text-white/85">Inteiro</div></div>
          <div><div className="text-2xl font-bold">{Math.max(0, 5 - (stats?.todayCount ?? 0))}</div><div className="text-xs text-white/85">Incompleto</div></div>
        </div>
      </div>


      <div className="grid grid-cols-2 px-4 mt-4 gap-y-2 text-sm">
        <div><div>{stats ? fmt(stats.todayEarnedCents) : "R$ 0"}</div><div className="text-muted-foreground text-xs">Obter comissão</div></div>
        <div className="text-right"><div>R$ 0,00</div><div className="text-muted-foreground text-xs">Congele</div></div>
        <div><div>{stats?.todayCount ?? 0}</div><div className="text-muted-foreground text-xs">Quantidade de ordem</div></div>
        <div className="text-right"><div>{profile ? fmt(profile.balance_cents) : "R$ 0"}</div><div className="text-muted-foreground text-xs">Balanço disponível</div></div>
      </div>

      {!activated && (
        <div className="mx-4 mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
          Sua conta ainda não está ativada. <Link to="/app/deposit" className="font-semibold underline">Deposite R$ 10</Link> para liberar as tarefas de avaliação da Shopee.
        </div>
      )}

      {activated && p && (
        <div className="mx-4 mt-4 rounded-2xl border border-border bg-card overflow-hidden shadow">
          <img src={p.image_url} alt={p.title} className="w-full h-48 object-cover" />
          <div className="p-4">
            <div className="font-semibold">{p.title}</div>
            <div className="text-sm text-muted-foreground">{fmt(p.price_cents)} · Shopee</div>
            <div className="flex items-center gap-1 mt-1 text-yellow-500">
              {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor" />)}
            </div>
            <div className="mt-2 text-xs text-emerald-600">Comissão por curtida: R$ 2,50</div>
          </div>
        </div>
      )}

      {msg && <div className="mx-4 mt-3 text-sm text-center text-primary">{msg}</div>}

      <div className="px-4 mt-4">
        <button
          onClick={like}
          disabled={!activated || busy || !p}
          className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <Heart size={18} /> {busy ? "..." : activated ? "Curtir e receber R$ 2,50" : "Começa a comprar"}
        </button>
      </div>

      <div className="px-4 mt-5 pb-4">
        <h3 className="font-bold">Descrição da tarefa agarrando</h3>
        <p className="text-xs text-muted-foreground leading-relaxed mt-2">
          *1 Cada curtida em produto da Shopee credita R$ 2,50 no seu saldo, que acumula automaticamente.<br/>
          *2 Saque disponível a partir de R$ 20,00.<br/>
          *3 Ative sua conta com um depósito único de R$ 10 para liberar as tarefas.
        </p>
      </div>
    </div>
  );
}
