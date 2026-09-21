import { frameColor } from "@/modules/progress";
import { LevelInsignia } from "@/shared/components/level-insignia";
import { formatMonthYear, formatNumber } from "@/shared/lib/format";
import { levelTitle } from "@/shared/lib/level";
import type { UserProfile } from "../types";

// O topo do perfil público: a insígnia do nível, o apelido grande, e o
// essencial em uma linha.
export function ProfileHeader({ profile }: { profile: UserProfile }) {
  return (
    <div className="flex items-center gap-5">
      <LevelInsignia level={profile.level} size="lg" color={frameColor(profile.frame, profile.level)} />
      <div className="flex min-w-0 flex-col gap-1.5">
        <h1 className="font-display text-display tracking-display truncate font-bold md:text-display-lg">@{profile.handle}</h1>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="label text-text-3 text-mini">{levelTitle(profile.level)}</span>
          <span className="text-border">·</span>
          <span className="font-mono">{formatNumber(profile.xp)} XP</span>
          <span className="text-border">·</span>
          <span>Desde {formatMonthYear(profile.joined_at)}</span>
        </div>
      </div>
    </div>
  );
}
