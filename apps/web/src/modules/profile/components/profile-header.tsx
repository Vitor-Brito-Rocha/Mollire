import { formatMonthYear, formatNumber } from "@/shared/lib/format";
import type { UserProfile } from "../types";

export function ProfileHeader({ profile }: { profile: UserProfile }) {
  return (
    <div className="flex items-start gap-5">
      <span className="hex bg-card font-display text-muted-foreground grid size-14 shrink-0 place-items-center text-2xl font-bold uppercase">
        {profile.handle.charAt(0)}
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[28px] leading-tight font-bold">@{profile.handle}</h1>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span>
            Nível <span className="text-foreground font-semibold">{profile.level}</span>
            {" · "}
            <span className="font-mono">{formatNumber(profile.xp)} XP</span>
          </span>
          <span className="text-border">·</span>
          <span>Membro desde {formatMonthYear(profile.joined_at)}</span>
        </div>
      </div>
    </div>
  );
}
