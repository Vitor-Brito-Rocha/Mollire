"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError, type CurrentUser, type GithubRepo, type Project } from "@/lib/api";

export default function NewProjectPage() {
  const router = useRouter();
  const [githubConnected, setGithubConnected] = useState(false);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [buildCommand, setBuildCommand] = useState("npm install && npm run build");
  const [outputDir, setOutputDir] = useState("dist");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<CurrentUser>("/users/me").then((me) => {
      if (!me.github_connected) return;
      setGithubConnected(true);
      setLoadingRepos(true);
      api
        .get<GithubRepo[]>("/github/repos?available=true")
        .then(setRepos)
        .catch(() => toast.error("Não foi possível carregar os repositórios"))
        .finally(() => setLoadingRepos(false));
    });
  }, []);

  function selectRepo(repo: GithubRepo) {
    setRepositoryUrl(repo.clone_url);
    if (!name) setName(repo.name);
    if (!slug) setSlug(repo.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const project = await api.post<Project>("/projects", {
        name,
        slug,
        repository_url: repositoryUrl,
        build_command: buildCommand,
        output_dir: outputDir,
      });
      toast.success("Projeto criado");
      router.push(`/projects/${project.slug}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Erro ao criar projeto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Novo projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {githubConnected && (
              <div className="flex flex-col gap-2">
                <Label>Repositório GitHub</Label>
                {loadingRepos ? (
                  <p className="text-muted-foreground text-sm">Carregando repositórios…</p>
                ) : repos.length > 0 ? (
                  <div className="border-border max-h-48 overflow-y-auto rounded-md border">
                    {repos.map((repo) => (
                      <button
                        key={repo.id}
                        type="button"
                        onClick={() => selectRepo(repo)}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                          repositoryUrl === repo.clone_url ? "bg-accent" : ""
                        }`}
                      >
                        <span className="truncate">{repo.full_name}</span>
                        {repo.private && (
                          <span className="text-muted-foreground ml-2 shrink-0 text-xs">privado</span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Nenhum repositório encontrado.</p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="slug">Slug (subdomínio)</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value.toLowerCase())}
                placeholder="meu-projeto"
                pattern="[a-z0-9][-a-z0-9]*[a-z0-9]?"
                required
              />
              <p className="text-muted-foreground text-xs">
                Ficará disponível em {slug || "slug"}.aulvi.com.br
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="repo">URL do repositório</Label>
              <Input
                id="repo"
                value={repositoryUrl}
                onChange={(event) => setRepositoryUrl(event.target.value)}
                placeholder="https://github.com/usuario/repo.git"
                required
              />
              {!githubConnected && (
                <p className="text-muted-foreground text-xs">
                  Conecte o{" "}
                  <a href="/perfil" className="underline">
                    GitHub
                  </a>{" "}
                  para acessar repositórios privados.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="build">Comando de build</Label>
              <Input
                id="build"
                value={buildCommand}
                onChange={(event) => setBuildCommand(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="output">Pasta de saída</Label>
              <Input
                id="output"
                value={outputDir}
                onChange={(event) => setOutputDir(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar projeto"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
