import { LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import { useSignOut } from "@/modules/auth";
import { Panel } from "@/shared/components/panel";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";

// Sair também mora no menu da conta; aqui é o lugar de quem veio procurar.
export function SessionPanel() {
  const navigate = useNavigate();
  const signOut = useSignOut();

  return (
    <Panel title="Sessão">
      <div className="flex items-center justify-between gap-4 p-5">
        <p className="text-text-3 text-xs">Encerra a sessão neste navegador. Seus sites continuam no ar.</p>
        <Button
          variant="destructive"
          size="sm"
          disabled={signOut.isPending}
          aria-busy={signOut.isPending}
          onClick={() => signOut.mutate(undefined, { onSuccess: () => navigate("/login") })}
        >
          {signOut.isPending ? <Spinner /> : <LogOut />}
          Sair
        </Button>
      </div>
    </Panel>
  );
}
