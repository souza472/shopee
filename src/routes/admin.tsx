import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAdminMe, adminLogout } from "@/lib/admin.functions";
import { LayoutDashboard, Users, Receipt, Settings, LogOut, ArrowDownToLine, Image } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const me = useServerFn(getAdminMe);
  const logout = useServerFn(adminLogout);
  const [ready, setReady] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (pathname === "/admin/login") { setReady(true); return; }
    me().then((r) => {
      if (!r.username) navigate({ to: "/admin/login" });
      else { setUsername(r.username); setReady(true); }
    });
  }, [pathname]);

  if (!ready) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (pathname === "/admin/login") return <Outlet />;

  const tabs = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/settings", label: "Gateway", icon: Settings },
    { to: "/admin/assets", label: "Logo & Banners", icon: Image },
    { to: "/admin/users", label: "Usuários", icon: Users },
    { to: "/admin/transactions", label: "SHOPEE (Depósitos)", icon: Receipt },
    { to: "/admin/withdrawals", label: "Saques", icon: ArrowDownToLine },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-foreground text-background px-4 py-3 flex items-center justify-between">
        <div className="font-bold">Shopee • Admin</div>
        <div className="flex items-center gap-3 text-sm">
          <span className="opacity-70">{username}</span>
          <button onClick={async () => { await logout(); navigate({ to: "/admin/login" }); }} className="flex items-center gap-1 hover:opacity-80">
            <LogOut size={14} /> Sair
          </button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row max-w-6xl mx-auto">
        <aside className="md:w-56 md:min-h-[calc(100vh-3rem)] border-r border-border bg-card">
          <nav className="flex md:flex-col overflow-x-auto">
            {tabs.map((t) => {
              const active = pathname === t.to || (t.to !== "/admin" && pathname.startsWith(t.to));
              const isDash = t.to === "/admin";
              const isActive = isDash ? pathname === "/admin" : active;
              const Icon = t.icon;
              return (
                <Link key={t.to} to={t.to} className={`flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap ${isActive ? "bg-primary/10 text-primary font-medium border-l-4 border-primary" : "text-foreground/70 hover:bg-muted"}`}>
                  <Icon size={16} /> {t.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 p-4 md:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
