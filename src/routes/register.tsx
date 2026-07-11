import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";
import { Smartphone, Lock, User, Ticket } from "lucide-react";

export const Route = createFileRoute("/register")({ component: RegisterPage });

function phoneToEmail(digits: string) { return `br${digits}@pixshop.com`; }

function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [referral, setReferral] = useState("");
  const [status, setStatus] = useState<{ kind: "error" | "info"; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null); setLoading(true);
    try {
      const digits = phone.replace(/\D/g, "");
      if (digits.length < 10) throw new Error("Telefone inválido");
      if (password.length < 6) throw new Error("Senha precisa ter 6+ caracteres");
      const { error } = await supabase.auth.signUp({
        email: phoneToEmail(digits), password,
        options: {
          data: { phone: digits, name: name.trim(), referred_by: referral.trim().toUpperCase() || null },
          emailRedirectTo: `${window.location.origin}/app`,
        },
      });
      if (error) throw error;
      navigate({ to: "/app" });
    } catch (err) {
      setStatus({ kind: "error", msg: err instanceof Error ? err.message : "Falha no cadastro" });
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {status?.kind === "error" && (
        <div className="w-full py-3 text-center text-white font-medium" style={{ background: "var(--brand-red)" }}>
          {status.msg}
        </div>
      )}
      <div className="flex-1 flex flex-col items-center px-6 pt-8 pb-6">
        <div className="flex flex-col items-center mb-4">
          <BrandLogo size={80} />
          <h1 className="mt-3 text-xl font-bold" style={{ color: "#EE4D2D" }}>Criar conta Shopee</h1>
          <p className="mt-1 text-xs text-muted-foreground">Comece a avaliar produtos e ganhar por PIX</p>
        </div>

        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
          <Field icon={<User className="text-primary" size={22} />}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" className="flex-1 bg-transparent outline-none" required />
          </Field>
          <Field icon={<Smartphone className="text-primary" size={22} />}>
            <span className="text-sm font-medium text-foreground/80">+ 55</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="numeric" placeholder="Telefone" className="flex-1 bg-transparent outline-none" required />
          </Field>
          <Field icon={<Lock className="text-primary" size={22} />}>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Senha (mín. 6)" className="flex-1 bg-transparent outline-none" required />
          </Field>
          <Field icon={<Ticket className="text-primary" size={22} />}>
            <input value={referral} onChange={(e) => setReferral(e.target.value)} placeholder="Código de promoção (opcional)" className="flex-1 bg-transparent outline-none" />
          </Field>

          <button type="submit" disabled={loading} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold shadow-md hover:opacity-95 transition disabled:opacity-60">
            {loading ? "Criando..." : "Cadastrar"}
          </button>
          <Link to="/" className="block text-center text-sm text-primary">Já tenho conta</Link>
          <p className="text-xs text-center text-muted-foreground pt-2">Após o cadastro, ative sua conta e liberar as tarefas.</p>
        </form>
      </div>
    </div>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="flex items-center gap-3 border-b-2 border-border pb-2">{icon}{children}</div>;
}
