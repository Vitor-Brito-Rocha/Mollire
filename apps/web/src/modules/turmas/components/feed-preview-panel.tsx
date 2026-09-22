import { Link } from "react-router";
import { Panel } from "@/shared/components/panel";
import type { TurmaFeedItem } from "../types";
import { FeedItem } from "./feed-item";

// Os três acontecimentos mais novos, na tela da turma, com o caminho para o
// hub. Sem itens (ou sem o back), não aparece.
export function FeedPreviewPanel({ turmaId, items }: { turmaId: string; items: TurmaFeedItem[] | undefined }) {
  if (!items || items.length === 0) return null;

  return (
    <Panel
      title="Novidades"
      aside={
        <Link to={`/turmas/${turmaId}/hub`} className="text-text-3 hover:text-foreground text-xs underline underline-offset-4 transition-colors">
          ver o hub
        </Link>
      }
    >
      <ul className="divide-border flex flex-col divide-y px-4">
        {items.slice(0, 3).map((item) => (
          <FeedItem key={item.id} item={item} compact />
        ))}
      </ul>
    </Panel>
  );
}
