import { Moon, Sun, SunMoon } from "lucide-react";
import { useTheme } from "@/shared/hooks/use-theme";
import { cn } from "@/shared/lib/utils";

// O botão de tema. `row` é a linha da barra lateral (rótulo + dois segmentos,
// o ativo aceso); `icon` é o botão compacto das barras estreitas e do login.
export function ThemeToggle({ variant = "icon", className }: { variant?: "row" | "icon"; className?: string }) {
  const { theme, setTheme, toggle } = useTheme();

  if (variant === "icon") {
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

  const options = [
    { value: "dark", label: "Modo escuro", Icon: Moon },
    { value: "light", label: "Modo claro", Icon: Sun },
  ] as const;

  return (
    <div className={cn("label text-muted-foreground flex h-10 items-center gap-3 px-3 text-mini", className)}>
      <SunMoon className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">Tema</span>
      <div role="group" aria-label="Tema" className="border-border flex border p-0.5">
        {options.map(({ value, label, Icon }) => {
          const on = theme === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={on}
              aria-label={label}
              title={label}
              onClick={() => setTheme(value)}
              className={cn(
                "focus-ring grid size-7 place-items-center transition-colors",
                on ? "bg-primary text-primary-foreground" : "hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
