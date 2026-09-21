import { LayoutGrid, LogOut, Plus, Shield, Star, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { useCurrentUser, useSignOut } from "@/modules/auth";
import { NotificationsToggle } from "@/modules/notifications";
import { LevelBar } from "@/shared/components/level-bar";
import { Logo } from "@/shared/components/logo";
import { levelTitle, padLevel } from "@/shared/lib/level";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Spinner } from "@/shared/ui/spinner";

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
  label: "Painel",
  icon: LayoutGrid,
  active: (p) => p === "/" || (p.startsWith("/projects/") && p !== "/projects/new"),
};
const NEW_PROJECT: Item = { to: "/projects/new", label: "Novo projeto", icon: Plus, active: (p) => p === "/projects/new" };
const PROFILE: Item = { to: "/perfil", label: "Perfil", icon: User, active: (p) => p === "/perfil" };
const ADMIN: Item = { to: "/admin", label: "Admin", icon: Shield, active: (p) => p.startsWith("/admin") };

function RailLink({ item, pathname }: { item: Item; pathname: string }) {
  const Icon = item.icon;
  const active = item.active(pathname);
  return (
    <Link
      to={item.to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "label relative flex h-10 items-center gap-3 px-3 text-[11px] tracking-[0.1em] transition-colors",
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
// faixa e a barra de XP. É o que um launcher mostra no canto — quem você é
// e quanto falta para o próximo nível.
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
        <p className="text-muted-foreground text-[13px] leading-snug">
          Entre para publicar seus projetos e dar estrelas no que gostou.
        </p>
        <Button size="lg" nativeButton={false} render={<Link to="/login">Entrar</Link>} />
      </div>
    );
  }

  return (
    <div className="surface mx-3 mt-4 flex flex-col gap-3 p-3">
      <Link to="/perfil" className="group flex items-center gap-3" aria-label="Seu perfil">
        <span className="relative grid size-12 shrink-0 place-items-center" aria-hidden="true">
          <span className="hex bg-primary glow absolute inset-0" />
          <span className="hex bg-card absolute inset-[2px]" />
          <span className="font-display text-primary relative text-[15px] font-bold">{padLevel(user.level)}</span>
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="group-hover:text-primary truncate text-[15px] font-semibold transition-colors">
            {user.handle ?? "Sem apelido"}
          </span>
          <span className="label text-text-3 text-[9.5px]">{levelTitle(user.level)}</span>
        </span>
      </Link>
      <LevelBar level={user.level} xp={user.xp} next={user.next} className="w-full" />
    </div>
  );
}

function RailFooter({ pathname }: { pathname: string }) {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const signOut = useSignOut();

  if (!user) return null;

  // The session cache flips to "signed out" inside the mutation; guards on
  // protected screens redirect on their own, this covers the public ones.
  const handleLogout = () => signOut.mutate(undefined, { onSuccess: () => navigate("/login") });

  return (
    <div className="border-border mt-auto flex flex-col gap-0.5 border-t px-3 py-4">
      <div className="px-3 pb-2">
        <NotificationsToggle />
      </div>
      <RailLink item={PROFILE} pathname={pathname} />
      {/* UX only: the backend's RolesGuard is the real boundary. */}
      {user.role === "ADMIN" && <RailLink item={ADMIN} pathname={pathname} />}
      <button
        type="button"
        onClick={handleLogout}
        disabled={signOut.isPending}
        className="label text-muted-foreground hover:text-foreground hover:bg-raised/70 flex h-10 items-center gap-3 px-3 text-[11px] tracking-[0.1em] transition-colors disabled:opacity-50"
      >
        {signOut.isPending ? <Spinner /> : <LogOut className="size-4" />}
        Sair
      </button>
    </div>
  );
}

// A coluna da esquerda de toda tela (públicas e logadas): marca, cartão do
// jogador, navegação, e a conta embaixo. Monta uma vez e fica.
export function SideRail() {
  const { pathname } = useLocation();
  const { user } = useCurrentUser();
  const items = user ? [PANEL, GALLERY, NEW_PROJECT] : [GALLERY];

  return (
    <aside className="bg-card/70 border-border sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col border-r backdrop-blur-md md:flex">
      <Link
        to={user ? "/" : "/galeria"}
        className="font-display border-border flex h-16 shrink-0 items-center gap-2.5 border-b px-5 text-[15px] font-bold tracking-[0.12em] uppercase"
      >
        <Logo height={24} />
        Mollire
      </Link>
      <PlayerCard />
      <nav className="flex flex-col gap-0.5 px-3 py-5" aria-label="Principal">
        {items.map((item) => (
          <RailLink key={item.to} item={item} pathname={pathname} />
        ))}
      </nav>
      <RailFooter pathname={pathname} />
    </aside>
  );
}

// Em telas estreitas a coluna vira uma barra no topo: marca, dois atalhos e
// o avatar (ou "Entrar").
export function MobileBar() {
  const { pathname } = useLocation();
  const { user } = useCurrentUser();
  const items = user ? [PANEL, GALLERY] : [GALLERY];

  return (
    <header className="bg-card/85 border-border sticky top-0 z-40 flex h-14 items-center justify-between border-b px-4 backdrop-blur-md md:hidden">
      <Link to={user ? "/" : "/galeria"} aria-label="Mollire" className="flex items-center">
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
                "label px-2.5 py-2 text-[10.5px] tracking-[0.1em] transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
        {user ? (
          <Link
            to="/perfil"
            aria-label="Seu perfil"
            className="hex bg-primary text-primary-foreground font-display ml-1 grid size-8 place-items-center text-[11px] font-bold"
          >
            {padLevel(user.level)}
          </Link>
        ) : (
          <Button size="sm" className="ml-1" nativeButton={false} render={<Link to="/login">Entrar</Link>} />
        )}
      </nav>
    </header>
  );
}
