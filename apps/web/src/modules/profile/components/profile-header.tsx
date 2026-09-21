import { formatMonthYear, formatNumber } from "@/shared/lib/format";
import { levelTitle, padLevel } from "@/shared/lib/level";
import type { UserProfile } from "../types";

// O topo do perfil público: a insígnia do nível, o apelido grande, e o
// essencial em uma linha.
export function ProfileHeader({ profile }: { profile: UserProfile }) {
  return (
    <div className="flex items-center gap-5">
      <span className="relative grid size-[76px] shrink-0 place-items-center" aria-hidden="true">
        <span className="hex bg-primary glow-lg absolute inset-0" />
        <span className="hex bg-card absolute inset-[2px]" />
        <span className="font-display text-primary relative text-[24px] font-bold">{padLevel(profile.level)}</span>
      </span>
      <div className="flex min-w-0 flex-col gap-1.5">
        <h1 className="font-display truncate text-[34px] leading-[1.02] font-bold tracking-[-0.02em] md:text-[42px]">
          @{profile.handle}
        </h1>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="label text-text-3 text-[10px]">{levelTitle(profile.level)}</span>
          <span className="text-border">·</span>
          <span className="font-mono">{formatNumber(profile.xp)} XP</span>
          <span className="text-border">·</span>
          <span>Desde {formatMonthYear(profile.joined_at)}</span>
        </div>
      </div>
    </div>
  );
}
