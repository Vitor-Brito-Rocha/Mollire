import { Flag, MessageSquare, NotebookPen, Rocket, Star, Upload, UserPlus } from "lucide-react";
import { Link } from "react-router";
import { frameColor } from "@/modules/progress";
import { projectUrl } from "@/modules/projects";
import { StatusChip } from "@/shared/components/status-chip";
import { formatTimeAgo } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import type { TeamMember, TurmaFeedItem } from "../types";

type Icon = React.ComponentType<{ className?: string }>;

// Ícone e cor por tipo de acontecimento. Verde para o que publica, acento
// para o que a turma faz junto, dourado só para a estrela.
const KIND: Record<TurmaFeedItem["type"], { icon: Icon; className: string }> = {
  deploy: { icon: Rocket, className: "bg-good/15 text-good" },
  note: { icon: NotebookPen, className: "bg-primary/15 text-primary" },
  milestone: { icon: Flag, className: "bg-good/15 text-good" },
  submit: { icon: Upload, className: "bg-primary/15 text-primary" },
  star: { icon: Star, className: "bg-gold/15 text-gold" },
  feedback: { icon: MessageSquare, className: "bg-primary/15 text-primary" },
  join: { icon: UserPlus, className: "bg-raised text-muted-foreground" },
};

function Actor({ actor }: { actor: TeamMember }) {
  return (
    <Link to={`/u/${actor.handle}`} className="hover:text-primary font-semibold transition-colors">
      {actor.handle}
    </Link>
  );
}

function ProjectLink({ project }: { project: { slug: string; name: string } }) {
  return (
    <a href={projectUrl(project.slug)} target="_blank" rel="noreferrer" className="hover:text-primary font-semibold transition-colors">
      {project.name}
    </a>
  );
}

// A frase de cada acontecimento. Quem, o quê, em qual projeto.
function Sentence({ item }: { item: TurmaFeedItem }) {
  switch (item.type) {
    case "deploy":
      return (
        <>
          {item.actor && <Actor actor={item.actor} />} publicou {item.project && <ProjectLink project={item.project} />}
          {item.commit_message && <span className="text-text-3"> · {item.commit_message}</span>}
        </>
      );
    case "note":
      return (
        <>
          {item.actor && <Actor actor={item.actor} />} escreveu no diário de {item.project && <ProjectLink project={item.project} />}
        </>
      );
    case "milestone":
      return (
        <>
          {item.group ? <span className="font-semibold">{item.group.name}</span> : "A turma"} cumpriu a entrega{" "}
          <span className="font-semibold">{item.milestone.title}</span>
          {item.status === "late" ? " depois do prazo" : " no prazo"}
          {item.project && (
            <>
              {" "}
              com <ProjectLink project={item.project} />
            </>
          )}
        </>
      );
    case "submit":
      return (
        <>
          {item.actor && <Actor actor={item.actor} />} enviou {item.project && <ProjectLink project={item.project} />} para a turma
        </>
      );
    case "star":
      return (
        <>
          {item.project && <ProjectLink project={item.project} />} recebeu {item.stars} {item.stars === 1 ? "estrela" : "estrelas"} dos colegas
        </>
      );
    case "feedback":
      return (
        <>
          {item.actor && <Actor actor={item.actor} />} deixou feedback em {item.project && <ProjectLink project={item.project} />}
        </>
      );
    case "join":
      return (
        <>
          {item.actor && <Actor actor={item.actor} />} entrou {item.group ? `no ${item.group.name}` : "na turma"}
        </>
      );
    default:
      return null;
  }
}

// Uma linha do feed: a insígnia de quem fez (ou o ícone do tipo), a frase, o
// texto quando há (diário, feedback), o grupo e há quanto tempo.
export function FeedItem({ item, compact = false }: { item: TurmaFeedItem; compact?: boolean }) {
  const kind = KIND[item.type];
  // Tipo que este front não conhece: a API pode crescer sem quebrar a tela.
  if (!kind) return null;
  const Icon = kind.icon;
  const text = item.type === "note" || item.type === "feedback" ? item.text : null;

  return (
    <li className={cn("flex items-start gap-3", compact ? "py-2.5" : "py-3")}>
      {item.actor ? (
        <span
          className="hex bg-raised font-display grid size-8 shrink-0 place-items-center text-mini font-bold uppercase"
          style={{ color: frameColor(item.actor.frame, item.actor.level) }}
          title={`@${item.actor.handle} · nível ${item.actor.level}`}
          aria-hidden="true"
        >
          {item.actor.handle.charAt(0)}
        </span>
      ) : (
        <span className={cn("hex grid size-8 shrink-0 place-items-center", kind.className)} aria-hidden="true">
          <Icon className="size-3.5" />
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className={cn("text-muted-foreground leading-snug", compact ? "text-xs" : "text-sm")}>
          <Sentence item={item} />
        </p>
        {text && !compact && (
          <blockquote className="border-primary/40 text-foreground/90 border-l-2 pl-3 text-sm leading-relaxed">{text}</blockquote>
        )}
        <span className="text-text-3 flex flex-wrap items-center gap-2 text-xs">
          <span>{formatTimeAgo(item.at)}</span>
          {item.group && item.type !== "join" && item.type !== "milestone" && !compact && (
            <StatusChip tone="idle">{item.group.name}</StatusChip>
          )}
        </span>
      </div>
      {item.actor && (
        <span className={cn("hex grid size-6 shrink-0 place-items-center", kind.className)} aria-hidden="true">
          <Icon className="size-3" />
        </span>
      )}
    </li>
  );
}
