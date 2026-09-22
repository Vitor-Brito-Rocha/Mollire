import { frameColor } from "@/modules/progress";
import { cn } from "@/shared/lib/utils";
import type { TeamMember } from "../types";

const MAX_SHOWN = 4;

// A equipe do projeto numa linha: hexágonos com a inicial, na cor da moldura
// de cada um, e os apelidos ao lado. Dono primeiro (a API já manda assim).
export function TeamAvatars({ team, className }: { team: TeamMember[]; className?: string }) {
  const shown = team.slice(0, MAX_SHOWN);
  const rest = team.length - shown.length;

  return (
    <span className={cn("flex min-w-0 items-center gap-2", className)} aria-label={`Equipe: ${team.map((m) => m.handle).join(", ")}`}>
      <span className="flex shrink-0 -space-x-1" aria-hidden="true">
        {shown.map((member) => (
          <span
            key={member.handle}
            title={`@${member.handle} · nível ${member.level}`}
            className="hex bg-raised font-display grid size-6 place-items-center text-mini font-bold uppercase"
            style={{ color: frameColor(member.frame, member.level) }}
          >
            {member.handle.charAt(0)}
          </span>
        ))}
      </span>
      <span className="text-text-3 truncate text-xs">
        {shown.map((m) => m.handle).join(", ")}
        {rest > 0 && ` +${rest}`}
      </span>
    </span>
  );
}
