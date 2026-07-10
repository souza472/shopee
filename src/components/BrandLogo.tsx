import { ShoppingBag, Check } from "lucide-react";

export function BrandLogo({ size = 96 }: { size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-2xl"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, oklch(0.7 0.2 20), oklch(0.65 0.22 15))",
        boxShadow: "0 8px 24px oklch(0.65 0.22 15 / 0.35)",
      }}
    >
      <ShoppingBag className="text-white" size={size * 0.55} strokeWidth={2} />
      <div
        className="absolute flex items-center justify-center rounded-full"
        style={{
          width: size * 0.42,
          height: size * 0.42,
          background: "oklch(0.85 0.18 85)",
          bottom: size * 0.22,
        }}
      >
        <Check className="text-white" size={size * 0.28} strokeWidth={4} />
      </div>
    </div>
  );
}
