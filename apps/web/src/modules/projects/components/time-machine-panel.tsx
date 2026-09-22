import { Panel } from "@/shared/components/panel";
import { TimeMachine, type TimeMachineFrame } from "@/shared/components/time-machine";
import { formatDayMonthTime } from "@/shared/lib/format";
import type { Snapshot } from "../types";

// Quantas capturas ficam montadas de uma vez (todas carregam ao abrir).
const MAX_FRAMES = 60;

// A máquina do tempo de um projeto: as capturas por deploy, em ordem, com a
// anotação do diário de cada uma. Só existe com duas capturas ou mais — uma
// só não conta evolução. Serve à tela do dono e à página pública.
export function TimeMachinePanel({ snapshots, className }: { snapshots: Snapshot[] | undefined; className?: string }) {
  if (!snapshots || snapshots.length < 2) return null;

  // A API manda do mais novo para o mais antigo; a linha do tempo lê ao contrário.
  const frames: TimeMachineFrame[] = [...snapshots]
    .reverse()
    .slice(-MAX_FRAMES)
    .map((s) => ({
      id: s.deployment_id,
      url: s.url,
      title: s.commit_message || "Deploy manual",
      meta: `${formatDayMonthTime(s.created_at)}${s.commit_sha ? ` · ${s.commit_sha.slice(0, 7)}` : ""}`,
      note: s.note?.text ?? null,
    }));

  return (
    <Panel title="Máquina do tempo" count={frames.length} className={className}>
      <div className="p-4">
        <TimeMachine frames={frames} />
      </div>
    </Panel>
  );
}
