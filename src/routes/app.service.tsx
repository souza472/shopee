import { createFileRoute } from "@tanstack/react-router";
import { Headphones } from "lucide-react";

export const Route = createFileRoute("/app/service")({ component: ServicePage });

function ServicePage() {
  return (
    <div className="max-w-md mx-auto p-6 text-center">
      <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
        <Headphones size={40} className="text-primary" />
      </div>
      <h1 className="mt-4 text-xl font-semibold">Atendimento ao cliente</h1>
      <p className="text-sm text-muted-foreground mt-2">Horário: 7h às 19h. Fale com nosso suporte pelo Telegram ou WhatsApp.</p>
      <a href="#" className="mt-6 inline-block h-11 px-6 rounded-full bg-primary text-primary-foreground leading-[2.75rem] font-semibold">Contatar suporte</a>
    </div>
  );
}
