import { ChevronsUpDown, GraduationCap, LayoutGrid, Plus, Settings, Shield, Star } from "lucide-react";
import { useMemo } from "react";
import { Link, useLocation } from "react-router";
import { useCurrentUser } from "@/modules/auth";
import { frameColor } from "@/modules/progress";
import { isInFlight, latestDeployment, useProjects, type Project } from "@/modules/projects";
import { useMyTurmas } from "@/modules/turmas";
import { Eyebrow } from "@/shared/components/eyebrow";
import { LevelBar } from "@/shared/components/level-bar";
import { LevelInsignia } from "@/shared/components/level-insignia";
import { Logo } from "@/shared/components/logo";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { levelTitle } from "@/shared/lib/level";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { ProfileMenu } from "./profile-menu";

type Item = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: (pathname: string) => boolean;
};

const GALLERY: Item = {
  to: "/galeria",
  label: "Galeria",
  icon: Star,
  active: (p) => p.startsWith("/galeria") || p.startsWith("/u/"),
};
const PANEL: Item = {
  to: "/",
  label: "Projetos",
  icon: LayoutGrid,
  active: (p) => p === "/" || (p.startsWith("/projects/") && p !== "/projects/new"),
};

const TURMAS: Item = {
  to: "/turmas",
  label: "Turmas",
  icon: GraduationCap,
  active: (p) => p.startsWith("/turmas"),
};

// Os dois do pé da barra: fora da navegação do dia a dia, sempre no mesmo lugar.
const SETTINGS: Item = {
  to: "/configuracoes",
  label: "Configurações",
  icon: Settings,
  active: (p) => p.startsWith("/configuracoes"),
};
const ADMIN: Item = {
  to: "/admin",
  label: "Admin",
  icon: Shield,
  active: (p) => p.startsWith("/admin"),
};

function RailLink({ item, pathname }: { item: Item; pathname: string }) {
  const Icon = item.icon;
  const active = item.active(pathname);
  return (
    <Link
      to={item.to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "label focus-ring relative flex h-10 items-center gap-3 px-3 text-mini transition-colors",
        active ? "text-primary bg-primary/8" : "text-muted-foreground hover:text-foreground hover:bg-raised/70",
      )}
    >
      {active && <span className="bg-primary glow absolute top-2 bottom-2 left-0 w-0.5" aria-hidden="true" />}
      <Icon className="size-4 shrink-0" />
      {item.label}
    </Link>
  );
}

// Quantos projetos a lista de recentes mostra: cabe numa tela de 900px com tudo o mais.
const RECENT_LIMIT = 4;

// Quando o projeto mexeu por último: o deploy mais novo, ou a edição.
const lastActivity = (project: Project) => latestDeployment(project.deployments)?.created_at ?? project.updated_at;

// A cor do ponto acompanha o deploy mais novo, como o chip de estado.
function dotClass(project: Project) {
  const latest = latestDeployment(project.deployments);
  if (!latest) return "[--dot:var(--text-3)]";
  if (isInFlight(latest.status)) return "[--dot:var(--primary)] animate-dot-pulse";
  return latest.status === "SUCCESS" ? "[--dot:var(--good)]" : "[--dot:var(--destructive)]";
}

// Os últimos projetos mexidos, para pular entre eles de qualquer tela — a
// "biblioteca" do launcher. Some quando não há projeto: a barra de quem está
// começando fica limpa.
function RecentProjects({ pathname }: { pathname: string }) {
  const { data: projects } = useProjects({ silent: true });
  const recent = useMemo(
    () => [...(projects ?? [])].sort((a, b) => lastActivity(b).localeCompare(lastActivity(a))).slice(0, RECENT_LIMIT),
    [projects],
  );

  if (recent.length === 0) return null;

  return (
    <nav className="flex flex-col gap-0.5 px-3" aria-label="Projetos recentes">
      <Eyebrow tone="muted" className="text-mini px-3 pt-1 pb-2">
        Recentes
      </Eyebrow>
      {recent.map((project) => {
        const active = pathname === `/projects/${project.slug}`;
        return (
          <Link
            key={project.slug}
            to={`/projects/${project.slug}`}
            aria-current={active ? "page" : undefined}
            title={project.name}
            className={cn(
              "focus-ring flex h-9 items-center gap-3 px-3 text-sm transition-colors",
              active ? "text-foreground bg-primary/8" : "text-muted-foreground hover:text-foreground hover:bg-raised/70",
            )}
          >
            <span
              className={cn("ml-0.5 size-1.5 shrink-0 bg-(--dot) shadow-[0_0_8px_var(--dot)]", dotClass(project))}
              aria-hidden="true"
            />
            <span className="truncate">{project.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// O cartão do jogador: insígnia hexagonal com o nível, apelido, título da
// faixa e a barra de XP. É o que um launcher mostra no canto — quem você é e
// quanto falta para o próximo nível — e é dele que abre o menu da conta.
function PlayerCard() {
  const { user, loading } = useCurrentUser();

  if (loading) {
    return (
      <div className="mx-3 mt-4 flex flex-col gap-3" aria-label="Carregando sessão">
        <Skeleton className="h-[62px] w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="surface mx-3 mt-4 flex flex-col gap-3 p-4">
        <p className="text-muted-foreground text-caption leading-snug">
          Entre para publicar seus projetos e dar estrelas no que gostou.
        </p>
        <Button size="lg" nativeButton={false} render={<Link to="/login">Entrar</Link>} />
      </div>
    );
  }

  return (
    <ProfileMenu
      user={user}
      trigger={
        <button
          type="button"
          className="surface hover:border-line-2 focus-visible:border-primary mx-3 mt-4 flex flex-col gap-3 p-3 text-left transition-colors outline-none"
        >
          <span className="flex w-full items-center gap-3">
            <LevelInsignia level={user.level} size="md" color={frameColor(user.frame, user.level)} />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-body-lg font-semibold">{user.handle ?? "Sem apelido"}</span>
              <span className="label text-text-3 text-mini">{levelTitle(user.level)}</span>
            </span>
            <ChevronsUpDown className="text-text-3 size-4 shrink-0" aria-hidden="true" />
          </span>
          <LevelBar level={user.level} xp={user.xp} next={user.next} className="w-full" />
        </button>
      }
    />
  );
}

// Criar projeto é o centro do produto, então não é "mais um item" da lista:
// é o botão de ação da barra, primeiro e com a cara do botão primário.
function NewProjectCta() {
  const { user } = useCurrentUser();
  const { pathname } = useLocation();
  if (!user) return null;
  const active = pathname === "/projects/new";
  return (
    <Link
      to="/projects/new"
      aria-current={active ? "page" : undefined}
      className={cn(
        "chamfer bg-primary text-primary-foreground font-display glow focus-ring mx-3 mt-3 flex h-11 items-center justify-center gap-2 text-xs font-bold tracking-label uppercase transition-colors",
        active ? "bg-primary/85" : "hover:bg-primary/85",
      )}
    >
      <Plus className="size-4" strokeWidth={2.5} />
      Novo projeto
    </Link>
  );
}

// A coluna da esquerda de toda tela (públicas e logadas): marca e tema no
// topo, o cartão do jogador (que abre o menu da conta), a ação principal, a
// navegação e os projetos recentes. No pé, só ajustes e admin — leves, como
// João pediu: nada ali pesa mais que a navegação.
export function SideRail() {
  const { pathname } = useLocation();
  const { user } = useCurrentUser();
  // "Turmas" só aparece quando a API responde: antes da migração do back, o item some em silêncio.
  const { isError: turmasUnavailable } = useMyTurmas(!!user, { silent: true });
  const items = user ? [PANEL, ...(turmasUnavailable ? [] : [TURMAS]), GALLERY] : [GALLERY];

  return (
    <aside className="bg-card/70 border-border sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col border-r backdrop-blur-md md:flex">
      <div className="border-border flex h-16 shrink-0 items-center justify-between border-b pr-2 pl-5">
        <Link
          to={user ? "/" : "/galeria"}
          className="focus-ring flex items-center"
        >
          <Logo height={18} />
        </Link>
        <ThemeToggle />
      </div>
      <PlayerCard />
      <NewProjectCta />
      <nav className="flex flex-col gap-0.5 px-3 py-5" aria-label="Principal">
        {items.map((item) => (
          <RailLink key={item.to} item={item} pathname={pathname} />
        ))}
      </nav>
      {user && <RecentProjects pathname={pathname} />}
      {user && (
        <nav className="border-border mt-auto flex flex-col gap-0.5 border-t px-3 py-3" aria-label="Conta">
          {user.role === "ADMIN" && <RailLink item={ADMIN} pathname={pathname} />}
          <RailLink item={SETTINGS} pathname={pathname} />
        </nav>
      )}
    </aside>
  );
}

// Em telas estreitas a coluna vira uma barra no topo: marca, dois atalhos,
// tema, "+" e o avatar, que abre o mesmo menu da conta (ou "Entrar").
export function MobileBar() {
  const { pathname } = useLocation();
  const { user } = useCurrentUser();
  // "Turmas" só aparece quando a API responde: antes da migração do back, o item some em silêncio.
  const { isError: turmasUnavailable } = useMyTurmas(!!user, { silent: true });
  const items = user ? [PANEL, ...(turmasUnavailable ? [] : [TURMAS]), GALLERY] : [GALLERY];

  return (
    <header className="bg-card/85 border-border sticky top-0 z-40 flex h-14 items-center justify-between border-b px-4 backdrop-blur-md md:hidden">
      <Link to={user ? "/" : "/galeria"} aria-label="Mollire" className="focus-ring flex items-center">
        <Logo height={18} />
      </Link>
      <nav className="flex min-w-0 items-center gap-1" aria-label="Principal">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.active(pathname);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              title={item.label}
              className={cn(
                "label focus-ring text-mini flex h-10 items-center px-2.5 transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              {/* Num celular estreito só o ícone cabe; a partir de `sm` o nome volta. */}
              <Icon className="size-4 shrink-0 sm:hidden" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
        {/* Logado, abaixo de `sm` o tema mora no menu da conta: a barra não tem largura pra tudo. */}
        <ThemeToggle className={cn("size-10", user && "hidden sm:grid")} />
        {user && (
          <Link
            to="/projects/new"
            aria-label="Novo projeto"
            className="chamfer-sm bg-primary text-primary-foreground focus-ring ml-1 grid size-10 place-items-center"
          >
            <Plus className="size-4" strokeWidth={2.5} />
          </Link>
        )}
        {user ? (
          <ProfileMenu
            user={user}
            align="end"
            className="min-w-[224px]"
            trigger={
              <button type="button" aria-label="Menu da conta" className="focus-ring ml-1 grid size-10 place-items-center">
                <LevelInsignia level={user.level} size="sm" solid color={frameColor(user.frame, user.level)} />
              </button>
            }
          />
        ) : (
          <Button size="sm" className="ml-1" nativeButton={false} render={<Link to="/login">Entrar</Link>} />
        )}
      </nav>
    </header>
  );
}
