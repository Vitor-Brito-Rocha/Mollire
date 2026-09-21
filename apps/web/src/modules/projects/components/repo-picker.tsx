import { Check, Lock, Search } from "lucide-react";
import { memo, useMemo, useState } from "react";
import type { GithubRepo } from "@/modules/github";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/spinner";

type RepoPickerProps = {
  repos: GithubRepo[] | undefined;
  loading: boolean;
  selectedUrl: string;
  onSelect: (repo: GithubRepo) => void;
  className?: string;
};

// A lista de repositórios da conta conectada: busca em cima, a lista ocupa
// o que sobrar de altura e rola por dentro, o escolhido fica marcado.
//
// Memoised: the parent re-renders on every keystroke of the form, and the list
// can be long (every repo of the connected account).
export const RepoPicker = memo(function RepoPicker({ repos, loading, selectedUrl, onSelect, className }: RepoPickerProps) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!repos) return [];
    return q ? repos.filter((repo) => repo.full_name.toLowerCase().includes(q)) : repos;
  }, [repos, query]);

  return (
    <div className={cn("surface flex min-h-0 flex-col", className)}>
      <div className="border-border flex items-center gap-2 border-b px-4 py-3">
        <h2 className="label">Repositório GitHub</h2>
        {repos && <span className="text-text-3 font-mono text-xs">{repos.length}</span>}
      </div>

      {loading ? (
        <p className="text-muted-foreground flex items-center gap-2 px-4 py-6 text-sm">
          <Spinner /> Carregando repositórios…
        </p>
      ) : !repos || repos.length === 0 ? (
        <p className="text-muted-foreground px-4 py-6 text-sm">
          Nenhum repositório disponível. Todos os seus já viraram projeto, ou o app do GitHub não tem acesso a eles.
        </p>
      ) : (
        <>
          <div className="relative px-3 pt-3 pb-2">
            <Search className="text-text-3 pointer-events-none absolute top-1/2 left-6 size-4 -translate-y-1/2" aria-hidden="true" />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar repositório…"
              aria-label="Buscar repositório"
              className="h-10 pl-9 font-mono text-sm"
            />
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto pb-2" aria-label="Repositórios">
            {visible.length === 0 && (
              <li className="text-muted-foreground px-4 py-6 text-sm">Nada com “{query.trim()}”.</li>
            )}
            {visible.map((repo) => {
              const selected = selectedUrl === repo.clone_url;
              const [owner, name] = repo.full_name.split("/");
              return (
                <li key={repo.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(repo)}
                    aria-pressed={selected}
                    className={cn(
                      "focus-ring group relative flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                      selected ? "bg-primary/8" : "hover:bg-raised/70",
                    )}
                  >
                    {selected && <span className="bg-primary glow absolute top-2 bottom-2 left-0 w-0.5" aria-hidden="true" />}
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className={cn("truncate text-sm font-semibold", selected && "text-primary")}>{name}</span>
                      <span className="text-text-3 truncate font-mono text-xs">{owner}</span>
                    </span>
                    {repo.private && (
                      <span className="label text-text-3 text-micro flex shrink-0 items-center gap-1">
                        <Lock className="size-3" aria-hidden="true" />
                        privado
                      </span>
                    )}
                    {selected && <Check className="text-primary size-4 shrink-0" aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
});
