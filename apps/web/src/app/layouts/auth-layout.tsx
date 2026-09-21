import { ArrowUpRight } from "lucide-react";
import { Link, Outlet } from "react-router";
import { Logo } from "@/shared/components/logo";
import { AuthShowcase } from "./auth-showcase";

// Telas de entrada em duas metades, como o cliente de um jogo: a vitrine à
// esquerda, o formulário à direita. No celular fica só o formulário.
export default function AuthLayout() {
  return (
    <div className="grid min-h-screen md:grid-cols-[1.08fr_1fr]">
      <AuthShowcase className="hidden md:flex" />
      <div className="flex flex-col">
        <header className="flex h-16 items-center justify-between px-6 md:px-12">
          <Link
            to="/galeria"
            className="font-display flex items-center gap-2.5 text-body-lg font-bold tracking-label uppercase"
          >
            <Logo height={24} />
            Mollire
          </Link>
          <Link
            to="/galeria"
            className="label text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-micro transition-colors"
          >
            Ver a galeria
            <ArrowUpRight className="size-3.5" />
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center px-6 py-10 md:px-12">
          <div className="w-full max-w-[400px]">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
