import { Bell, LogOut, Shield, User } from "lucide-react";
import { useNavigate } from "react-router";
import { useSignOut, type CurrentUser } from "@/modules/auth";
import { usePushSubscription } from "@/modules/notifications";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Spinner } from "@/shared/ui/spinner";

type ProfileMenuProps = {
  user: CurrentUser;
  // O que abre o menu: o cartão do jogador na barra lateral, o avatar no celular.
  trigger: React.ReactElement;
  align?: "start" | "end";
  className?: string;
};

// O menu da conta: perfil, admin, notificações e sair. É o que tira o peso do
// rodapé da barra lateral sem esconder nada — tudo fica a um clique do cartão.
export function ProfileMenu({ user, trigger, align = "start", className }: ProfileMenuProps) {
  const navigate = useNavigate();
  const signOut = useSignOut();
  const push = usePushSubscription();

  // The session cache flips to "signed out" inside the mutation; guards on
  // protected screens redirect on their own, this covers the public ones.
  const handleLogout = () => signOut.mutate(undefined, { onSuccess: () => navigate("/login") });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent align={align} sideOffset={6} className={className}>
        {/* GroupLabel do Base UI: só existe dentro de um Group. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="truncate text-sm font-semibold">{user.handle ?? "Sem apelido"}</span>
            {/* Só o dono vê o e-mail; aqui é a tela dele. */}
            <span className="text-text-3 truncate font-mono text-xs font-normal">{user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/perfil")}>
          <User />
          Perfil
        </DropdownMenuItem>
        {/* UX only: the backend's RolesGuard is the real boundary. */}
        {user.role === "ADMIN" && (
          <DropdownMenuItem onClick={() => navigate("/admin")}>
            <Shield />
            Admin
          </DropdownMenuItem>
        )}
        {push.supported && (
          <DropdownMenuCheckboxItem
            checked={push.subscribed}
            onCheckedChange={(checked) => push.setSubscribed(checked)}
            closeOnClick={false}
            disabled={push.isPending}
          >
            <Bell />
            Notificações de deploy
            {push.isPending && <Spinner className="ml-auto size-3" />}
          </DropdownMenuCheckboxItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleLogout} disabled={signOut.isPending}>
          {signOut.isPending ? <Spinner /> : <LogOut />}
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
