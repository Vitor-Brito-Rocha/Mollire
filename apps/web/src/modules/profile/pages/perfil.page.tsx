import { useCurrentUser } from "@/modules/auth";
import { AchievementGrid, FramePicker, XpHistory, isFrameId, useAchievements, useXpHistory } from "@/modules/progress";
import { ProgressPanel, useProjects } from "@/modules/projects";
import { PageHeader } from "@/shared/components/page-header";
import { Skeleton } from "@/shared/ui/skeleton";
import { OwnProfileCard } from "../components/own-profile-card";
import { useUpdateFrame } from "../hooks/use-profile";

// O jogador: nível, conquistas, moldura e histórico de XP — o mesmo painel do
// dashboard, com os mesmos números. A conta (e-mail, apelido, GitHub) fica em
// /configuracoes.
export default function PerfilPage() {
  const { user } = useCurrentUser();
  const { data: projects } = useProjects();
  const { data: achievements } = useAchievements(user ? "me" : null);
  const { data: xpEvents } = useXpHistory(!!user);
  const updateFrame = useUpdateFrame();

  return (
    <div className="mx-auto flex w-full max-w-(--page-narrow) flex-col gap-7">
      <PageHeader
        eyebrow="Progresso"
        title="Perfil"
        description="Seu nível, suas conquistas e a insígnia que a galeria vê."
      />

      {user === null ? (
        <Skeleton className="h-56 w-full" aria-busy="true" />
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-col gap-6">
            <OwnProfileCard user={user} />
            {achievements && <AchievementGrid achievements={achievements} showLocked />}
            {/* Só quando a API devolve o campo: antes disso o PATCH não teria onde gravar. */}
            {user.frame !== undefined && (
              <FramePicker
                level={user.level}
                current={isFrameId(user.frame) ? user.frame : "default"}
                pending={updateFrame.isPending}
                onSelect={(frame) => updateFrame.mutate(frame)}
              />
            )}
          </div>
          <div className="flex flex-col gap-6">
            <ProgressPanel user={user} projects={projects ?? []} />
            {xpEvents && <XpHistory events={xpEvents} />}
          </div>
        </div>
      )}
    </div>
  );
}
