import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createPixIn, listMyPendingPix } from "@/lib/pix.functions";
import QRCode from "qrcode";
import { ChevronLeft, Check, Copy, QrCode } from "lucide-react";

export const Route = createFileRoute("/app/deposit")({ component: DepositPage });

const PRESETS = [20, 50, 100, 300, 500, 1000, 3000, 5000, 10000];
const METHODS = ["NuPay", "VeloPay", "LumiPay", "NexaPay", "VittaPay"];

type Pending = { id: string; external_id: string; amount_cents: number; pix_copy_paste: string | null; created_at: string };

function DepositPage() {
  const nav = useNavigate();
  const createPix = useServerFn(createPixIn);
  const listPending = useServerFn(listMyPendingPix);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Lpay");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pix, setPix] = useState<{ code: string; qr: string; amount: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState<Pending[]>([]);
  const [openPending, setOpenPending] = useState<{ p: Pending; qr: string } | null>(null);

  async function refreshPending() {
    const r = await listPending();
    setPending(r.pending as Pending[]);
  }
  useEffect(() => { refreshPending(); }, []);


  async function submit() {
    setErr(null); setLoading(true); setPix(null);
    try {
      const n = parseFloat(amount.replace(",", "."));
      if (!n || n < 1) throw new Error("Valor mínimo R$ 1,00");
      const res = await createPix({ data: { amountCents: Math.round(n * 100), description: `Depósito ${method}` } });
      const qr = await QRCode.toDataURL(res.pixCopyPaste ?? "", { width: 240, margin: 1 });
      setPix({ code: res.pixCopyPaste ?? "", qr, amount: Math.round(n * 100) });
      refreshPending();
    } catch (e) { setErr(e instanceof Error ? e.message : "Erro"); }
    finally { setLoading(false); }
  }

  async function showPending(p: Pending) {
    if (!p.pix_copy_paste) return;
    const qr = await QRCode.toDataURL(p.pix_copy_paste, { width: 240, margin: 1 });
    setOpenPending({ p, qr });
  }


  return (
    <div className="max-w-md mx-auto">
      <header className="bg-primary text-primary-foreground px-4 py-4 flex items-center relative">
        <button onClick={() => nav({ to: "/app" })}><ChevronLeft /></button>
        <h1 className="absolute left-1/2 -translate-x-1/2 font-medium">recarregar</h1>
      </header>

      <div className="p-4">
        <div className="rounded-2xl p-5 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, oklch(0.72 0.18 45), oklch(0.65 0.2 40))" }}>
          <div className="text-sm">Por favor, insira o valor da recarga</div>
          <div className="text-3xl mt-2">R$ <span className="font-bold">{amount || ""}</span></div>
          <div className="absolute right-3 bottom-2 text-5xl opacity-80">💳</div>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-4">
          {PRESETS.map((v) => (
            <button key={v} onClick={() => setAmount(String(v))}
              className={`h-11 rounded-md border ${amount === String(v) ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
              {v}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-6 border-b border-border pb-2">
          <span className="text-primary">🅱️</span>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Por favor, insira o valor da recarga"
            className="flex-1 h-11 bg-transparent outline-none" inputMode="decimal" />
        </div>

        <div className="flex items-center gap-2 mt-6 mb-3">
          <span className="w-1 h-4 bg-primary rounded" />
          <h2 className="font-medium">Método de Pagamento</h2>
        </div>
        {METHODS.map((m) => (
          <button key={m} onClick={() => setMethod(m)} className="w-full flex items-center justify-between py-3 border-b border-border">
            <span className="flex items-center gap-3">💳 <span>{m}</span></span>
            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === m ? "border-blue-500 bg-blue-500" : "border-muted-foreground"}`}>
              {method === m && <Check size={12} className="text-white" />}
            </span>
          </button>
        ))}

        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

        <button onClick={submit} disabled={loading}
          className="w-full h-12 mt-6 rounded-full bg-primary text-primary-foreground font-semibold disabled:opacity-60">
          {loading ? "..." : "recarregar"}
        </button>

        {pix && (
          <div className="mt-6 bg-card border border-border rounded-2xl p-4 flex flex-col items-center">
            <div className="text-sm text-muted-foreground">Valor do pagamento</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">R$ {(pix.amount/100).toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-3">QR Code PIX</div>
            <img src={pix.qr} alt="QR" className="rounded-lg border mt-2" />
            <button onClick={() => { navigator.clipboard.writeText(pix.code); setCopied(true); setTimeout(()=>setCopied(false), 2000);}}
              className="mt-3 px-6 py-2 rounded bg-emerald-500 text-white text-sm font-medium flex items-center gap-2">
              {copied ? <><Check size={14}/> Copiado</> : <><Copy size={14}/> Copiar código</>}
            </button>
            <p className="text-xs text-muted-foreground mt-3 text-center">O saldo é creditado automaticamente após o pagamento. Depósito acumulado ≥ R$ 10 ativa sua conta.</p>
          </div>
        )}

        {pending.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1 h-4 bg-primary rounded" />
              <h3 className="font-medium">Pix pendentes ({pending.length}/5)</h3>
            </div>
            <div className="space-y-2">
              {pending.map((p) => (
                <button key={p.id} onClick={() => showPending(p)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border bg-card text-left">
                  <div>
                    <div className="font-semibold">R$ {(p.amount_cents/100).toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString("pt-BR")}</div>
                  </div>
                  <QrCode size={18} className="text-primary" />
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4">
          *1. O valor do pagamento deve corresponder ao valor solicitado.<br/>
          *2. Deposite pelo menos R$ 10 (uma vez) para ativar sua conta e liberar as tarefas.<br/>
          *3. Você pode ter até 5 Pix pendentes ao mesmo tempo.
        </p>
      </div>

      {openPending && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setOpenPending(null)}>
          <div className="bg-card rounded-2xl p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-center text-sm text-muted-foreground">Valor do pagamento</div>
            <div className="text-center text-2xl font-bold text-emerald-600 mt-1">
              R$ {(openPending.p.amount_cents/100).toFixed(2)}
            </div>
            <img src={openPending.qr} alt="QR" className="rounded-lg border mt-3 mx-auto" />
            <button onClick={() => { navigator.clipboard.writeText(openPending.p.pix_copy_paste ?? ""); }}
              className="w-full mt-3 h-10 rounded-lg bg-emerald-500 text-white text-sm font-medium flex items-center justify-center gap-2">
              <Copy size={14}/> Copiar código
            </button>
            <button onClick={() => setOpenPending(null)}
              className="w-full mt-2 h-10 rounded-lg border border-border text-sm">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );

}
