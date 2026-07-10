import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";
import { Smartphone, Lock } from "lucide-react";

export const Route = createFileRoute("/")({
  component: LoginPage,
});

function phoneToEmail(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `br${digits}@pixshop.user`;
}

function LoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [status, setStatus] = useState<{ kind: "error" | "info"; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app" });
    });
    const saved = typeof window !== "undefined" ? localStorage.getItem("pixshop:phone") : null;
    if (saved) { setPhone(saved); setRemember(true); }
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      const digits = phone.replace(/\D/g, "");
      if (digits.length < 10) throw new Error("Telefone inválido");
      const { error } = await supabase.auth.signInWithPassword({
        email: phoneToEmail(digits), password,
      });
      if (error) throw error;
      if (remember) localStorage.setItem("pixshop:phone", digits);
      else localStorage.removeItem("pixshop:phone");
      navigate({ to: "/app" });
    } catch (err) {
      setStatus({ kind: "error", msg: err instanceof Error ? err.message : "Falha no login" });
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {status?.kind === "error" && (
        <div className="w-full py-3 text-center text-white font-medium" style={{ background: "var(--brand-red)" }}>
          {status.msg}
        </div>
      )}
      <div className="flex-1 flex flex-col items-center px-6 pt-10 pb-6">
        <div className="flex flex-col items-center mb-8">
          <BrandLogo size={112} />
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Shopping Global</h1>
          <p className="text-sm text-muted-foreground">Entre para acessar sua carteira</p>
        </div>

        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
          <div className="flex items-center gap-3 border-b-2 border-border pb-2">
            <Smartphone className="text-primary" size={22} />
            <span className="text-sm font-medium text-foreground/80">+ 55</span>
            <input type="tel" inputMode="numeric" placeholder="Digite seu telefone"
              value={phone} onChange={(e) => setPhone(e.target.value)}
              className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground" required />
          </div>
          <div className="flex items-center gap-3 border-b-2 border-border pb-2">
            <Lock className="text-primary" size={22} />
            <input type="password" placeholder="Digite sua senha"
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground" required />
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground/80 pt-1 cursor-pointer">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-primary" />
            Lembrar-se da senha
          </label>
          <button type="submit" disabled={loading}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-base shadow-md hover:opacity-95 transition disabled:opacity-60">
            {loading ? "Carregando..." : "Entrar"}
          </button>
          <Link to="/register"
            className="block w-full h-12 leading-[3rem] text-center rounded-full border-2 border-primary text-primary font-semibold hover:bg-primary/5 transition">
            Cadastre-se
          </Link>
        </form>
      </div>
    </div>
  );
}
