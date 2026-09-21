import { memo } from "react";
import { Label } from "@/shared/ui/label";
import { Spinner } from "@/shared/ui/spinner";
import type { GithubRepo } from "@/modules/github";

type RepoPickerProps = {
  repos: GithubRepo[] | undefined;
  loading: boolean;
  selectedUrl: string;
  onSelect: (repo: GithubRepo) => void;
};

// Memoised: the parent re-renders on every keystroke of the form, and the list
// can be long (every repo of the connected account).
export const RepoPicker = memo(function RepoPicker({ repos, loading, selectedUrl, onSelect }: RepoPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label>Repositório GitHub</Label>
      {loading ? (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <Spinner /> Carregando repositórios…
        </p>
      ) : repos && repos.length > 0 ? (
        <div className="border-border max-h-48 overflow-y-auto rounded-md border">
          {repos.map((repo) => (
            <button
              key={repo.id}
              type="button"
              onClick={() => onSelect(repo)}
              aria-pressed={selectedUrl === repo.clone_url}
              className={`hover:bg-accent flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                selectedUrl === repo.clone_url ? "bg-accent" : ""
              }`}
            >
              <span className="truncate">{repo.full_name}</span>
              {repo.private && <span className="text-muted-foreground ml-2 shrink-0 text-xs">privado</span>}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">Nenhum repositório encontrado.</p>
      )}
    </div>
  );
});
