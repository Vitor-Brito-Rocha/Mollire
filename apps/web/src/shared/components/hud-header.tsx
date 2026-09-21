import { Link, useLocation } from "react-router";
import { cn } from "@/shared/lib/utils";
import { Logo } from "@/shared/components/logo";

const LINKS = [
  { href: "/galeria", label: "Galeria", active: (p: string) => p.startsWith("/galeria") },
  { href: "/", label: "Seus projetos", active: (p: string) => p === "/" || p.startsWith("/projects") },
];

// A barra superior de toda tela: marca, navegação e um slot à direita para o
// que a tela precisar (sessão, nível, entrar). Serve tanto às rotas públicas
// quanto às autenticadas — por isso não sabe nada de sessão.
export function HudHeader({ children }: { children?: React.ReactNode }) {
  const { pathname } = useLocation();

  return (
    <header className="bg-card border-border flex h-[60px] shrink-0 items-center justify-between border-b px-5 md:px-10">
      <Link
        to="/galeria"
        className="font-display flex items-center gap-2.5 text-[15px] font-bold tracking-[0.12em] uppercase"
      >
        <Logo height={22} />
        Mollire
      </Link>

      <nav className="label hidden items-center gap-8 md:flex">
        {LINKS.map((link) => {
          const active = link.active(pathname);
          return (
            <Link
              key={link.href}
              to={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "border-b-2 pb-1 transition-colors",
                active
                  ? "border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground border-transparent",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3.5">{children}</div>
    </header>
  );
}
