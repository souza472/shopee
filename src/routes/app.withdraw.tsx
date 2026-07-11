import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile } from "@/lib/pix.functions";
import { requestWithdrawal } from "@/lib/withdrawals.functions";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/app/withdraw")({ component: WithdrawPage });

const PRESETS = [20, 50, 100, 300, 500, 1000, 3000, 5000, 10000];

function WithdrawPage() {
  const nav = useNavigate();
  const fetchProfile = useServerFn(getMyProfile);
  const doWithdraw = useServerFn(requestWithdrawal);
  const [profile, setProfile] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [holder, setHolder] = useState("");
  const [doc, setDoc] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { fetchProfile().then((r) => {
    const p: any = r.profile;
    setProfile(p);
    if (p?.name) setHolder(p.name);
    if (p?.document) setDoc(p.document);
  }); }, []);

  async function submit() {
    setErr(null); setOk(null); setBusy(true);
    try {
      const n = parseFloat(amount.replace(",", "."));
      if (!n || n < 20) throw new Error("Saque mínimo R$ 20,00");
      if (!pixKey) throw new Error("Informe a chave PIX");
      if (!holder || !doc) throw new Error("Preencha nome e CPF");
      const r = await doWithdraw({ data: {
        amountCents: Math.round(n * 100),
        pixKeyType: "CPF",
        pixKey,
        holderName: holder,
        holderDocument: doc,
      }});
      setOk(r.fee > 0 ? `Pedido enviado! Taxa do primeiro saque: R$ ${(r.fee/100).toFixed(2)}` : "Pedido enviado!");
      setAmount(""); fetchProfile().then((r) => setProfile(r.profile));
    } catch (e) { setErr(e instanceof Error ? e.message : "Erro"); }
    finally { setBusy(false); }
  }

  return (
    <div className="max-w-md mx-auto">
      <header className="bg-primary text-primary-foreground px-4 py-4 flex items-center relative">
        <button onClick={() => nav({ to: "/app/profile" })}><ChevronLeft /></button>
        <h1 className="absolute left-1/2 -translate-x-1/2 font-medium">Retirar</h1>
        <span className="ml-auto">🎧</span>
      </header>

      <div className="p-4">
        <div className="rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg, oklch(0.72 0.18 45), oklch(0.65 0.2 40))" }}>
          <div className="text-sm">Quantidade retirada</div>
          <div className="text-3xl font-bold mt-1">{profile ? `R$ ${(profile.balance_cents/100).toFixed(2)}` : "R$ 0,00"}</div>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-4">
          {PRESETS.map((v) => (
            <button key={v} onClick={() => setAmount(String(v))}
              className={`h-11 rounded-md border ${amount === String(v) ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
              {v}
            </button>
          ))}
          <button onClick={() => setAmount(profile ? String(Math.floor(profile.balance_cents/100)) : "")}
            className="h-11 rounded-md border border-border">Inteiro</button>
        </div>

        <Field icon="🅱️" placeholder="Por favor, insira o valor do saque" value={amount} onChange={setAmount} />
        <Field icon="👤" placeholder="Nome do titular" value={holder} onChange={setHolder} />
        <Field icon="🪪" placeholder="CPF do titular" value={doc} onChange={setDoc} />
        <Field icon="🔑" placeholder="Chave PIX (CPF)" value={pixKey} onChange={setPixKey} />
        <Field icon="🔒" placeholder="Contrasinha de retirada" value={password} onChange={setPassword} type="password" />

        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        {ok && <p className="mt-3 text-sm text-emerald-600">{ok}</p>}

        <button onClick={submit} disabled={busy}
          className="w-full h-12 mt-4 rounded-full bg-primary text-primary-foreground font-semibold disabled:opacity-60">
          {busy ? "..." : "Retiração confirmada"}
        </button>

        <div className="mt-4 text-xs text-muted-foreground space-y-1 leading-relaxed">
          <p>*1. Os saques são creditados em sua conta em 3 a 10 minutos.</p>
          <p>*2. Taxa de R$ 1,50 por saque, para custos operacionais e melhorias do site.</p>
          <p>*3. Para cada novo saque é necessário subir de nível VIP fazendo um novo depósito.</p>
          <p>*4. Horário de atendimento financeiro: 7h às 19h.</p>
          <p>*5. Verifique o endereço da carteira do destinatário. Informações incorretas fazem os fundos não serem recebidos.</p>
        </div>

        <Link to="/app/history" className="block mt-4 text-center text-sm text-primary">Ver histórico de saques</Link>
      </div>
    </div>
  );
}



function Field({ icon, placeholder, value, onChange, type }: { icon: string; placeholder: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="flex items-center gap-3 mt-4 border-b border-border pb-2">
      <span>{icon}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type ?? "text"}
        className="flex-1 h-10 bg-transparent outline-none placeholder:text-muted-foreground" />
    </div>
  );
}
