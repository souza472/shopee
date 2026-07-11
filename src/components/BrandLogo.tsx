import logoUrl from "@/assets/shopee-logo.png";

export function BrandLogo({ size = 96 }: { size?: number }) {
  return (
    <img
      src={logoUrl}
      alt="Shopee"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: "contain" }}
      className="drop-shadow-md"
    />
  );
}
