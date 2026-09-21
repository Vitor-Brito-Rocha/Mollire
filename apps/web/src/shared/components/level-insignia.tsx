import { padLevel } from "@/shared/lib/level";
import { cn } from "@/shared/lib/utils";

const SIZES = {
  sm: { box: "size-8", inner: "inset-[1.5px]", text: "text-mini" },
  md: { box: "size-12", inner: "inset-[2px]", text: "text-body-lg" },
  lg: { box: "size-20", inner: "inset-[3px]", text: "text-title" },
} as const;

type LevelInsigniaProps = {
  level: number;
  size?: keyof typeof SIZES;
  // Hexágono cheio no acento (barra do celular). Sem brilho, sem miolo.
  solid?: boolean;
  className?: string;
};

// A insígnia do nível: hexágono no acento com o número dentro. É a mesma em
// todo lugar — barra lateral, painel de nível, perfil — só muda o tamanho.
export function LevelInsignia({ level, size = "md", solid = false, className }: LevelInsigniaProps) {
  const s = SIZES[size];
  const label = `Nível ${level}`;

  if (solid) {
    return (
      <span
        role="img"
        aria-label={label}
        className={cn("hex bg-primary text-primary-foreground font-display grid shrink-0 place-items-center font-bold", s.box, s.text, className)}
      >
        {padLevel(level)}
      </span>
    );
  }

  return (
    <span role="img" aria-label={label} className={cn("relative grid shrink-0 place-items-center", s.box, className)}>
      <span className={cn("hex bg-primary absolute inset-0", size === "lg" ? "glow-lg" : "glow")} />
      <span className={cn("hex bg-card absolute", s.inner)} />
      <span className={cn("font-display text-primary relative font-bold", s.text)}>{padLevel(level)}</span>
    </span>
  );
}
