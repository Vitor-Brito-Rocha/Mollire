import { Panel } from "@/shared/components/panel";
import { projectHost } from "../lib/project-url";
import type { Deployment } from "../types";
import { DeploymentRow } from "./deployment-row";

type DeploymentHistoryProps = {
  slug: string;
  deployments: Deployment[];
  // A deploy is running: the newest row shows the live log and re-deploy is off.
  inFlight: boolean;
  liveLog: string;
  // Commit being re-deployed right now (its row shows the spinner), and whether
  // any deploy request is pending (locks the others).
  redeployingSha: string | null;
  deployPending: boolean;
  onRedeploy: (commitSha: string) => void;
  // Diário de bordo: o deploy cuja anotação está sendo salva, e o salvar.
  savingNoteFor: string | null;
  onSaveNote: (deploymentId: string, text: string) => void;
};

export function DeploymentHistory({
  slug,
  deployments,
  inFlight,
  liveLog,
  redeployingSha,
  deployPending,
  onRedeploy,
  savingNoteFor,
  onSaveNote,
}: DeploymentHistoryProps) {
  // A chave `note` presente (mesmo null) é como o back diz que o diário existe.
  const noteSupported = deployments.some((d) => d.note !== undefined);
  return (
    <Panel title="Histórico de deploys" count={deployments.length}>
      {deployments.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
          <p className="text-muted-foreground">Nenhum deploy ainda.</p>
          <p className="text-text-3 max-w-[38ch] text-sm">
            O primeiro deploy clona o repositório, roda o build e publica em {projectHost(slug)}.
          </p>
        </div>
      ) : (
        deployments.map((deployment, index) => {
          const running = index === 0 && inFlight;
          // A versão no ar é o deploy publicado mais recente.
          const current = deployment.id === deployments.find((d) => d.status === "SUCCESS")?.id;
          return (
            <DeploymentRow
              key={deployment.id}
              deployment={deployment}
              log={running ? liveLog : deployment.log}
              defaultOpen={running && !!liveLog}
              current={current}
              canRedeploy={!inFlight && !deployPending}
              redeploying={redeployingSha === deployment.commit_sha}
              onRedeploy={onRedeploy}
              canNote={noteSupported && deployment.status === "SUCCESS"}
              savingNote={savingNoteFor === deployment.id}
              onSaveNote={onSaveNote}
            />
          );
        })
      )}
    </Panel>
  );
}
