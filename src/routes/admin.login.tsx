import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminLogin } from "@/lib/admin.functions";
import { BrandLogo } from "@/components/BrandLogo";
import { Lock, User } from "lucide-react";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const login = useServerFn(adminLogin);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      const r = await login({ data: { username, password } });
      if (!r.ok) throw new Error(r.error);
      navigate({ to: "/admin" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha no login");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {err && <div className="w-full py-3 text-center text-white font-medium" style={{ background: "var(--brand-red)" }}>{err}</div>}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <BrandLogo size={80} />
        <h1 className="mt-3 text-xl font-bold">Painel do Administrador</h1>
        <form onSubmit={onSubmit} className="mt-6 w-full max-w-sm space-y-4">
          <div className="flex items-center gap-3 border-b-2 border-border pb-2">
            <User className="text-primary" size={22} />
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Usuário" className="flex-1 bg-transparent outline-none" required autoComplete="username" />
          </div>
          <div className="flex items-center gap-3 border-b-2 border-border pb-2">
            <Lock className="text-primary" size={22} />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Senha" className="flex-1 bg-transparent outline-none" required autoComplete="current-password" />
          </div>
          <button disabled={loading} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold shadow-md disabled:opacity-60">
            {loading ? "..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
