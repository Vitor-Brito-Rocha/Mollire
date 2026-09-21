import { Link, isRouteErrorResponse, useRouteError } from "react-router";
import { Button } from "@/shared/ui/button";

function Screen({ title, message, action }: { title: string; message: string; action: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="font-display text-display font-bold">{title}</h1>
      <p className="text-muted-foreground text-body-lg">{message}</p>
      {action}
    </div>
  );
}

export function NotFound() {
  return (
    <Screen
      title="Página não encontrada"
      message="O endereço não existe ou foi movido."
      action={<Button nativeButton={false} render={<Link to="/">Voltar ao início</Link>} />}
    />
  );
}

// Render errors and failed lazy chunks (e.g. a deploy replaced the bundle while the tab was open).
export function RouteError() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFound />;
  return (
    <Screen
      title="Algo deu errado"
      message="Não foi possível carregar esta tela. Recarregue a página para tentar de novo."
      action={<Button onClick={() => window.location.reload()}>Recarregar</Button>}
    />
  );
}
