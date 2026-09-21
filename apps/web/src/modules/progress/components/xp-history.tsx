import { Link } from "react-router";
import { Panel } from "@/shared/components/panel";
import { formatTimeAgo } from "@/shared/lib/format";
import { XP_REASONS } from "../lib/catalog";
import type { XpEvent } from "../types";

// De onde veio cada XP. Transparência é o que separa progresso de moedinha.
export function XpHistory({ events }: { events: XpEvent[] }) {
  if (events.length === 0) return null;

  return (
    <Panel title="Histórico de XP">
      <ul>
        {events.map((event) => (
          <li key={event.id} className="border-border flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0">
            <span className="text-primary w-10 shrink-0 font-mono text-sm font-semibold tabular-nums">+{event.amount}</span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm">{XP_REASONS[event.reason]}</span>
              {event.ref?.project && (
                <Link to={`/projects/${event.ref.project.slug}`} className="text-text-3 hover:text-foreground truncate text-xs transition-colors">
                  {event.ref.project.name}
                </Link>
              )}
              {event.ref?.handle && (
                <Link to={`/u/${event.ref.handle}`} className="text-text-3 hover:text-foreground truncate text-xs transition-colors">
                  por {event.ref.handle}
                </Link>
              )}
            </span>
            <span className="text-text-3 shrink-0 text-xs">{formatTimeAgo(event.created_at)}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
