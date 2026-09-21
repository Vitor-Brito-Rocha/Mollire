import { cn } from "@/shared/lib/utils";

type EyebrowProps = {
  // primary: rótulo de seção acima de um título ("— Painel").
  // section: título de bloco (h2) em texto normal com o traço no acento.
  // muted: rótulo discreto ("— Publicados recentemente").
  tone?: "primary" | "section" | "muted";
  as?: "span" | "h2";
  className?: string;
  // Para uma cor fora do sistema (a cor de um projeto): o traço acompanha.
  style?: React.CSSProperties;
  children: React.ReactNode;
};

// O rótulo com traço do HUD, a marca de seção que aparece em toda tela. Um
// componente só, para que o traço tenha sempre o mesmo comprimento e o texto
// o mesmo espaçamento.
export function Eyebrow({ tone = "primary", as: Tag = "span", className, style, children }: EyebrowProps) {
  return (
    <Tag
      className={cn(
        "label tracking-eyebrow flex items-center gap-2.5",
        tone === "primary" && "text-primary",
        tone === "muted" && "text-text-3",
        className,
      )}
      style={style}
    >
      <span className={cn("h-0.5 w-[18px] shrink-0", tone === "section" ? "bg-primary" : "bg-current")} aria-hidden="true" />
      {children}
    </Tag>
  );
}
