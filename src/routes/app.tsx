import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Home, ClipboardList, Headphones, User, Hand } from "lucide-react";

export const Route = createFileRoute("/app")({ component: AppLayout });

function AppLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/" });
      else setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  if (!ready) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;

  const tabs = [
    { to: "/app", label: "Índice", icon: Home },
    { to: "/app/tasks", label: "Tarefa", icon: ClipboardList },
    { to: "/app/service", label: "Serviço", icon: Headphones },
    { to: "/app/profile", label: "meu", icon: User },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 pb-24">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 inset-x-0 bg-card border-t border-border flex items-end justify-around pt-2 pb-2 z-40">
        <TabItem tab={tabs[0]} active={pathname === "/app"} />
        <TabItem tab={tabs[1]} active={pathname.startsWith("/app/tasks")} />
        <Link to="/app/tasks" className="-mt-8 relative">
          <div className="w-16 h-16 rounded-full bg-primary shadow-lg flex items-center justify-center border-4 border-background">
            <Hand size={28} className="text-white" />
          </div>
        </Link>
        <TabItem tab={tabs[2]} active={pathname.startsWith("/app/service")} />
        <TabItem tab={tabs[3]} active={pathname.startsWith("/app/profile") || pathname.startsWith("/app/history") || pathname.startsWith("/app/deposit") || pathname.startsWith("/app/withdraw") || pathname.startsWith("/app/bank")} />
      </nav>
    </div>
  );
}

function TabItem({ tab, active }: { tab: { to: string; label: string; icon: any }; active: boolean }) {
  const Icon = tab.icon;
  return (
    <Link to={tab.to} className={`flex-1 flex flex-col items-center text-xs gap-0.5 ${active ? "text-primary" : "text-muted-foreground"}`}>
      <Icon size={22} className={active ? "fill-primary/20" : ""} />
      <span>{tab.label}</span>
    </Link>
  );
}
