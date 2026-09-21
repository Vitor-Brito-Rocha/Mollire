import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/shared/hooks/use-theme";
import { cn } from "@/shared/lib/utils";

// O botão de tema: um ícone que mostra para onde você vai (sol no escuro,
// lua no claro). Fica ao lado da logo na barra lateral, na barra do celular
// e no cabeçalho do login.
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const next = theme === "dark" ? "claro" : "escuro";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Mudar para o modo ${next}`}
      title={`Modo ${next}`}
      className={cn(
        "focus-ring text-muted-foreground hover:text-foreground hover:bg-raised/70 grid size-9 place-items-center transition-colors",
        className,
      )}
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
