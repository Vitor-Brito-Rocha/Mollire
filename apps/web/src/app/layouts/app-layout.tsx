import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router";
import { toast } from "sonner";
import { signOut, useCurrentUser } from "@/modules/auth";
import { NotificationsToggle } from "@/modules/notifications";
import { HudHeader } from "@/shared/components/hud-header";
import { LevelBar } from "@/shared/components/level-bar";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Spinner } from "@/shared/ui/spinner";

// Slot direito da barra superior: o que muda é só quem está logado.
function SessionActions() {
  const navigate = useNavigate();
  const { user, loading } = useCurrentUser();
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout() {
    setSigningOut(true);
    const { error } = await signOut();
    if (error) {
      setSigningOut(false);
      toast.error(error);
      return;
    }
    // The session cache flips to "signed out" inside signOut; guards on
    // protected screens redirect on their own, this covers public ones.
    setSigningOut(false);
    toast.success("Você saiu da sua conta");
    navigate("/login");
  }

  if (loading) {
    return <Skeleton className="h-[34px] w-32" aria-label="Carregando sessão" />;
  }

  if (!user) {
    return <Button size="sm" nativeButton={false} render={<Link to="/login">Entrar</Link>} />;
  }

  return (
    <>
      <LevelBar level={user.level} xp={user.xp} next={user.next} className="hidden sm:flex" />
      <NotificationsToggle />
      {/* UX only: the backend's RolesGuard is the real boundary. */}
      {user.role === "ADMIN" && (
        <Button variant="outline" size="sm" nativeButton={false} render={<Link to="/admin">Admin</Link>} />
      )}
      {/* O avatar leva ao perfil, onde o apelido público é escolhido. */}
      <Link
        to="/perfil"
        aria-label="Seu perfil"
        className="hex bg-raised font-display text-muted-foreground hover:text-foreground grid size-[34px] place-items-center text-xs font-bold uppercase transition-colors"
      >
        {(user.handle ?? user.email).charAt(0) || "?"}
      </Link>
      <Button variant="ghost" size="sm" onClick={handleLogout} disabled={signingOut}>
        {signingOut && <Spinner />}
        Sair
      </Button>
    </>
  );
}

// O shell de toda tela com menu (públicas e logadas): a barra superior monta
// uma vez e fica; só o que está dentro do <Outlet /> troca de rota em rota.
// Cada tela define apenas a largura do próprio conteúdo (mx-auto max-w-[…]).
export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <HudHeader>
        <SessionActions />
      </HudHeader>
      <main className="flex flex-1 flex-col px-5 py-8 md:px-10">
        <Outlet />
      </main>
    </div>
  );
}
