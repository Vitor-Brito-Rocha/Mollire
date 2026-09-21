import { ChevronsUpDown, LayoutGrid, Plus, Star } from "lucide-react";
import { Link, useLocation } from "react-router";
import { useCurrentUser } from "@/modules/auth";
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
            <LevelInsignia level={user.level} size="md" />
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
// topo, o cartão do jogador (que abre o menu da conta), a ação principal e a
// navegação. Sem rodapé: nada aqui pesa mais que a navegação.
export function SideRail() {
  const { pathname } = useLocation();
  const { user } = useCurrentUser();
  const items = user ? [PANEL, GALLERY] : [GALLERY];

  return (
    <aside className="bg-card/70 border-border sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col border-r backdrop-blur-md md:flex">
      <div className="border-border flex h-16 shrink-0 items-center justify-between border-b pr-2 pl-5">
        <Link
          to={user ? "/" : "/galeria"}
          className="font-display focus-ring flex items-center gap-2.5 text-body-lg font-bold tracking-label uppercase"
        >
          <Logo height={24} />
          Mollire
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
    </aside>
  );
}

// Em telas estreitas a coluna vira uma barra no topo: marca, dois atalhos,
// tema, "+" e o avatar, que abre o mesmo menu da conta (ou "Entrar").
export function MobileBar() {
  const { pathname } = useLocation();
  const { user } = useCurrentUser();
  const items = user ? [PANEL, GALLERY] : [GALLERY];

  return (
    <header className="bg-card/85 border-border sticky top-0 z-40 flex h-14 items-center justify-between border-b px-4 backdrop-blur-md md:hidden">
      <Link to={user ? "/" : "/galeria"} aria-label="Mollire" className="focus-ring flex items-center">
        <Logo height={22} />
      </Link>
      <nav className="flex items-center gap-1" aria-label="Principal">
        {items.map((item) => {
          const active = item.active(pathname);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "label focus-ring text-mini flex h-10 items-center px-2.5 transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
        <ThemeToggle className="size-10" />
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
                <LevelInsignia level={user.level} size="sm" solid />
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
