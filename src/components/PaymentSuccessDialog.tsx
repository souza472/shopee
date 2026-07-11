import { useEffect } from "react";
import confetti from "canvas-confetti";

export function PaymentSuccessDialog({ open, amountCents, onClose }: { open: boolean; amountCents: number; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    // fire confetti bursts
    const end = Date.now() + 1500;
    const shoot = () => {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 }, colors: ["#EE4D2D", "#F59E0B", "#FFD34E", "#22c55e"] });
      if (Date.now() < end) requestAnimationFrame(shoot);
    };
    shoot();
    const t = setTimeout(onClose, 8000);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-card rounded-3xl p-8 max-w-sm w-full text-center animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto w-32 h-32 relative">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="46" fill="none" stroke="hsl(142 76% 45%)" strokeWidth="6" strokeLinecap="round"
              strokeDasharray="289" strokeDashoffset="289"
              style={{ animation: "drawCircle 0.8s ease-out forwards", transform: "rotate(-90deg)", transformOrigin: "50% 50%" }} />
            <path d="M30 52 L45 66 L72 38" fill="none" stroke="hsl(142 76% 45%)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="70" strokeDashoffset="70"
              style={{ animation: "drawCheck 0.4s 0.7s ease-out forwards" }} />
          </svg>
        </div>
        <style>{`
          @keyframes drawCircle { to { stroke-dashoffset: 0 } }
          @keyframes drawCheck { to { stroke-dashoffset: 0 } }
        `}</style>
        <h2 className="mt-4 text-2xl font-bold text-emerald-600">Parabéns!</h2>
        <p className="mt-2 text-lg font-semibold">Pagamento confirmado</p>
        <div className="mt-1 text-3xl font-bold text-primary">
          R$ {(amountCents / 100).toFixed(2)}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Seu depósito foi processado com sucesso. Você já pode começar as tarefas e ganhar dinheiro!
        </p>
        <button onClick={onClose}
          className="mt-5 w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold shadow-md">
          Começar tarefas
        </button>
      </div>
    </div>
  );
}
