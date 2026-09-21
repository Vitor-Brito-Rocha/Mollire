import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { FormField } from "@/shared/components/form-field";
import { SubmitButton } from "@/shared/components/submit-button";
import { Spinner } from "@/shared/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { useCurrentUser } from "@/modules/auth";
import { useBuildScript, useGithubRepos, type GithubRepo } from "@/modules/github";
import { RepoPicker } from "../components/repo-picker";
import { useCreateProject } from "../hooks/use-projects";
import { projectHost } from "../lib/project-url";

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
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
  const { data: detection, isFetching: detecting } = useBuildScript(selectedRepo);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [buildCommand, setBuildCommand] = useState("npm install && npm run build");
  const [outputDir, setOutputDir] = useState("dist");

  // Functional updates keep this callback stable, so the memoised RepoPicker
  // isn't re-rendered by typing in the form.
  const selectRepo = useCallback((repo: GithubRepo) => {
    setSelectedRepo(repo);
    setRepositoryUrl(repo.clone_url);
    setName((current) => current || repo.name);
    setSlug((current) => current || slugify(repo.name));
  }, []);

  // Obvious package.json build script: fill it in. Ambiguous: the user picks below.
  useEffect(() => {
    if (detection?.build_command) setBuildCommand(detection.build_command);
  }, [detection]);

  const ambiguousScripts = detection && !detection.build_command ? detection.candidates : [];

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
            {detecting && (
              <p className="text-muted-foreground flex items-center gap-2 text-xs">
                <Spinner /> Detectando script de build…
              </p>
            )}
            {ambiguousScripts.length > 1 && (
              <fieldset className="flex flex-col gap-2">
                <legend className="text-muted-foreground mb-2 text-sm">Escolha o comando de build</legend>
                {ambiguousScripts.map((script) => {
                  const command = `npm install && npm run ${script.name}`;
                  return (
                    <label key={script.name} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="build-script"
                        checked={buildCommand === command}
                        onChange={() => setBuildCommand(command)}
                      />
                      <span className="font-mono text-xs">npm run {script.name}</span>
                    </label>
                  );
                })}
              </fieldset>
            )}
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
