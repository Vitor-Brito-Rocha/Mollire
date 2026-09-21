import { useState, type FormEvent } from "react";
import { StatusChip } from "@/modules/projects";
import { EmptyState } from "@/shared/components/empty-state";
import { FormField } from "@/shared/components/form-field";
import { Panel } from "@/shared/components/panel";
import { SubmitButton } from "@/shared/components/submit-button";
import { formatDayMonthYear } from "@/shared/lib/format";
import { Skeleton } from "@/shared/ui/skeleton";
import { AdminError } from "../components/admin-error";
import { useAdmins, useInviteAdmin } from "../hooks/use-admin";
import { Eyebrow } from "@/shared/components/eyebrow";

const ROW = "border-border grid grid-cols-12 items-center gap-3 border-b px-4 py-3 last:border-b-0";

export default function AdminAdminsPage() {
  const [email, setEmail] = useState("");
  const { data, isPending, refetch } = useAdmins();
  const invite = useInviteAdmin();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    invite.mutate(email.trim(), { onSuccess: () => setEmail("") });
  }

  const pending = data?.pendingInvites ?? [];

  return (
    <div className="flex flex-col gap-6">
      <section className="corners bg-card border-border flex flex-col gap-4 border p-5">
        <div className="flex flex-col gap-1.5">
          <Eyebrow>Conceder acesso</Eyebrow>
          <p className="text-muted-foreground text-sm">
            Quem já fez login vira admin na hora. Quem nunca entrou fica pendente e vira admin no primeiro login. Só
            concede — nunca remove.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <FormField
              id="email"
              label="E-mail"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="pessoa@exemplo.com"
              required
            />
          </div>
          <SubmitButton size="lg" pending={invite.isPending} pendingLabel="Enviando…">
            Tornar admin
          </SubmitButton>
        </form>
      </section>

      {isPending ? (
        <Skeleton className="h-48 w-full" aria-busy="true" />
      ) : !data ? (
        <AdminError onRetry={refetch}>Erro ao carregar os admins.</AdminError>
      ) : data.admins.length + pending.length === 0 ? (
        <EmptyState>Nenhum admin ainda.</EmptyState>
      ) : (
        <Panel title="Admins" count={data.admins.length}>
          {pending.length > 0 && (
            <p className="text-muted-foreground border-border border-b px-4 py-2 text-xs">
              {pending.length === 1 ? "1 convite pendente" : `${pending.length} convites pendentes`}
            </p>
          )}
          <div className="label text-text-3 border-border grid grid-cols-12 gap-3 border-b px-4 py-2.5 text-micro">
            <span className="col-span-7 sm:col-span-6">E-mail</span>
            <span className="col-span-5 sm:col-span-3">Estado</span>
            <span className="hidden sm:col-span-3 sm:block">Desde</span>
          </div>
          {data.admins.map((admin) => (
            <div key={admin.id} className={ROW}>
              <span className="col-span-7 truncate font-mono text-caption sm:col-span-6">{admin.email}</span>
              <StatusChip tone="good" className="col-span-5 sm:col-span-3">
                Admin
              </StatusChip>
              <span className="text-muted-foreground hidden text-caption sm:col-span-3 sm:block">
                {formatDayMonthYear(admin.created_at)}
              </span>
            </div>
          ))}
          {pending.map((item) => (
            <div key={item.email} className={ROW}>
              <span className="col-span-7 truncate font-mono text-caption sm:col-span-6">{item.email}</span>
              <StatusChip tone="busy" className="col-span-5 sm:col-span-3">
                Pendente · 1º login
              </StatusChip>
              <span className="text-muted-foreground hidden text-caption sm:col-span-3 sm:block">
                convidado em {formatDayMonthYear(item.created_at)}
              </span>
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}
