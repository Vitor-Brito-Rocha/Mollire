import { encode } from "uqr";
import { cn } from "@/shared/lib/utils";

// Um QR code em SVG puro, sem imagem externa: um caminho só com todos os
// módulos escuros. Para projetar na parede e a turma abrir no celular.
export function QrCode({ value, label, className }: { value: string; label: string; className?: string }) {
  const { data, size } = encode(value, { ecc: "M", border: 1 });
  let path = "";
  data.forEach((row, y) => row.forEach((dark, x) => { if (dark) path += `M${x} ${y}h1v1h-1z`; }));

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
      className={cn("block h-auto w-full bg-white", className)}
    >
      <path d={path} fill="#0b0e14" />
    </svg>
  );
}
