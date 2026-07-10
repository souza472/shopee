import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile, updateMyProfile } from "@/lib/pix.functions";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/app/bank")({ component: BankPage });

function BankPage() {
  const nav = useNavigate();
  const fetchProfile = useServerFn(getMyProfile);
  const update = useServerFn(updateMyProfile);
  const [name, setName] = useState("");
  const [doc, setDoc] = useState("");
  const [keyType, setKeyType] = useState("CPF");
  const [pixKey, setPixKey] = useState("");
  const [pwd, setPwd] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { fetchProfile().then((r) => {
    const p: any = r.profile;
    if (p?.name) setName(p.name);
    if (p?.document) { setDoc(p.document); setPixKey(p.document); }
  }); }, []);

  async function submit() {
    setMsg(null);
    try {
      await update({ data: { name, document: doc } });
      setMsg("Dados salvos com sucesso");
    } catch (e) { setMsg(e instanceof Error ? e.message : "Erro"); }
  }

  return (
    <div className="max-w-md mx-auto">
      <header className="bg-primary text-primary-foreground px-4 py-4 flex items-center relative">
        <button onClick={() => nav({ to: "/app/profile" })}><ChevronLeft /></button>
        <h1 className="absolute left-1/2 -translate-x-1/2 font-medium">Liga cartão bancário</h1>
        <span className="ml-auto">🎧</span>
      </header>
      <div className="p-4 space-y-4">
        <Row label="Nome real"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome real" className="w-full h-10 bg-transparent outline-none border-b border-border" /></Row>
        <Row label="Tipos de Chave PIX"><select value={keyType} onChange={(e) => setKeyType(e.target.value)} className="w-full h-10 bg-transparent outline-none border-b border-border"><option>CPF</option><option>EMAIL</option><option>PHONE</option><option>RANDOM</option></select></Row>
        <Row label="Conta PIX"><input value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="Por favor, insira o número da sua conta PIX" className="w-full h-10 bg-transparent outline-none border-b border-border" /></Row>
        <Row label="Número do CPF"><input value={doc} onChange={(e) => setDoc(e.target.value)} placeholder="Cadastro de Pessoas Físicas" className="w-full h-10 bg-transparent outline-none border-b border-border" /></Row>
        <Row label="Contrasinha de retirada"><input value={pwd} onChange={(e) => setPwd(e.target.value)} type="password" placeholder="Por favor, introduza a senha de retirada" className="w-full h-10 bg-transparent outline-none border-b border-border" /></Row>

        {msg && <p className="text-sm text-primary">{msg}</p>}
        <button onClick={submit} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold">confirmar</button>
        <p className="text-xs text-muted-foreground">Digite as informações corretas, caso contrário, seu pagamento não será recebido.</p>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-sm text-foreground/80">{label}</label>{children}</div>;
}
