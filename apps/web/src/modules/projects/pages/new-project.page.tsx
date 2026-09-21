import { useCallback, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { FormField } from "@/shared/components/form-field";
import { SubmitButton } from "@/shared/components/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { useCurrentUser } from "@/modules/auth";
import { RepoPicker } from "../components/repo-picker";
import { useCreateProject } from "../hooks/use-projects";
import { useGithubRepos } from "../hooks/use-project-reads";
import { projectHost } from "../lib/project-url";
import type { GithubRepo } from "../types";

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export default function NewProjectPage() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const githubConnected = !!user?.github_connected;
  const { data: repos, isPending: loadingRepos } = useGithubRepos(githubConnected);
  const createProject = useCreateProject();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [buildCommand, setBuildCommand] = useState("npm install && npm run build");
  const [outputDir, setOutputDir] = useState("dist");

  // Functional updates keep this callback stable, so the memoised RepoPicker
  // isn't re-rendered by typing in the form.
  const selectRepo = useCallback((repo: GithubRepo) => {
    setRepositoryUrl(repo.clone_url);
    setName((current) => current || repo.name);
    setSlug((current) => current || slugify(repo.name));
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    createProject.mutate(
      { name, slug, repository_url: repositoryUrl, build_command: buildCommand, output_dir: outputDir },
      { onSuccess: (project) => navigate(`/projects/${project.slug}`) },
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Novo projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {githubConnected && (
              <RepoPicker
                repos={repos}
                loading={loadingRepos}
                selectedUrl={repositoryUrl}
                onSelect={selectRepo}
              />
            )}

            <FormField id="name" label="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
            <div className="flex flex-col gap-2">
              <FormField
                id="slug"
                label="Slug (subdomínio)"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="meu-projeto"
                pattern="[a-z0-9][\-a-z0-9]*[a-z0-9]?"
                required
              />
              <p className="text-muted-foreground text-xs">Ficará disponível em {projectHost(slug || "slug")}</p>
            </div>
            <div className="flex flex-col gap-2">
              <FormField
                id="repo"
                label="URL do repositório"
                value={repositoryUrl}
                onChange={(e) => setRepositoryUrl(e.target.value)}
                placeholder="https://github.com/usuario/repo.git"
                required
              />
              {!githubConnected && (
                <p className="text-muted-foreground text-xs">
                  Conecte o{" "}
                  <Link to="/perfil" className="underline">
                    GitHub
                  </Link>{" "}
                  para acessar repositórios privados.
                </p>
              )}
            </div>
            <FormField
              id="build"
              label="Comando de build"
              value={buildCommand}
              onChange={(e) => setBuildCommand(e.target.value)}
            />
            <FormField
              id="output"
              label="Pasta de saída"
              value={outputDir}
              onChange={(e) => setOutputDir(e.target.value)}
            />
            <SubmitButton pending={createProject.isPending} pendingLabel="Criando…">
              Criar projeto
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
