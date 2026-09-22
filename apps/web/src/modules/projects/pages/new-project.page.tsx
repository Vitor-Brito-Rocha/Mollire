import { GitBranch } from "lucide-react";
import { useCallback, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useCurrentUser } from "@/modules/auth";
import { useBuildScript, useGithubRepos, type GithubRepo } from "@/modules/github";
import { FormField } from "@/shared/components/form-field";
import { PageHeader } from "@/shared/components/page-header";
import { SubmitButton } from "@/shared/components/submit-button";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { RepoPicker } from "../components/repo-picker";
import { RootDirField } from "../components/root-dir-field";
import { useCreateProject } from "../hooks/use-projects";
import { blocksSubmit, useRootDirCheck } from "../hooks/use-root-dir-check";
import { projectHost } from "../lib/project-url";
import { isValidRootDir, normalizeRootDir } from "../lib/root-dir";

// Só o build: o npm install a plataforma roda antes, sempre.
const DEFAULT_BUILD = "npm run build";

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Sem GitHub conectado, a coluna do repositório vira o convite para conectar;
// a URL pública ainda funciona pelo campo da direita.
function ConnectGithub() {
  return (
    <div className="surface flex flex-col items-start gap-4 p-6">
      <span className="hex bg-raised text-muted-foreground grid size-12 place-items-center">
        <GitBranch className="size-5" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1.5">
        <h2 className="font-display text-heading font-bold">Conecte o GitHub</h2>
        <p className="text-muted-foreground max-w-[42ch] text-sm leading-relaxed">
          Com a conta conectada, seus repositórios aparecem aqui, inclusive os privados, e cada push vira um deploy
          sozinho. Sem conectar, cole a URL de um repositório público ao lado.
        </p>
      </div>
      <Button variant="outline" size="lg" nativeButton={false} render={<Link to="/configuracoes">Conectar nas configurações</Link>} />
    </div>
  );
}

export default function NewProjectPage() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const githubConnected = !!user?.github_connected;
  const { data: repos, isPending: loadingRepos } = useGithubRepos(githubConnected);
  const createProject = useCreateProject();
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [rootDir, setRootDir] = useState("");
  // A pasta é sugerida pela pessoa (monorepo), então a detecção do package.json
  // e a checagem "ela existe?" seguem o que foi digitado, já sem mudar a cada tecla.
  const { state: rootDirState, settledRootDir } = useRootDirCheck(repositoryUrl, rootDir);
  const { data: detection, isFetching: detecting } = useBuildScript(
    isValidRootDir(settledRootDir) ? selectedRepo : null,
    settledRootDir,
  );
  // null: o usuário ainda não mexeu; vale o que a detecção sugerir, ou o padrão.
  const [buildCommand, setBuildCommand] = useState<string | null>(null);
  const [outputDir, setOutputDir] = useState("dist");

  const effectiveBuild = buildCommand ?? detection?.build_command ?? DEFAULT_BUILD;
  const ambiguousScripts = detection && !detection.build_command ? detection.candidates : [];
  const detected = !buildCommand && !!detection?.build_command;

  // Functional updates keep this callback stable, so the memoised RepoPicker
  // isn't re-rendered by typing in the form.
  const selectRepo = useCallback((repo: GithubRepo) => {
    setSelectedRepo(repo);
    setRepositoryUrl(repo.clone_url);
    // Outro repositório, outra estrutura: a pasta volta para a raiz.
    setRootDir("");
    setName((current) => current || repo.name);
    setSlug((current) => current || slugify(repo.name));
    // Repositório novo, sugestão nova: o campo volta a seguir a detecção.
    setBuildCommand(null);
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    createProject.mutate(
      {
        name,
        slug,
        repository_url: repositoryUrl,
        root_dir: normalizeRootDir(rootDir),
        build_command: effectiveBuild,
        output_dir: outputDir,
      },
      { onSuccess: (project) => navigate(`/projects/${project.slug}`) },
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-(--page) flex-col gap-6 xl:h-(--screen)">
      <PageHeader
        back={{ to: "/", label: "Seus projetos" }}
        title="Novo projeto"
        description={`Escolha o repositório, confira o build, e o site sobe em ${projectHost("seu-projeto")}. Cada push depois disso vira um deploy.`}
      />

      {/* Uma linha só, do tamanho do que sobra da tela: a lista rola por dentro. */}
      <form
        onSubmit={handleSubmit}
        className="grid min-h-0 flex-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] xl:grid-rows-[minmax(0,1fr)]"
      >
        {githubConnected ? (
          <RepoPicker
            repos={repos}
            loading={loadingRepos}
            selectedUrl={repositoryUrl}
            onSelect={selectRepo}
            className="max-h-[360px] xl:max-h-none"
          />
        ) : (
          <ConnectGithub />
        )}

        <div className="surface flex flex-col gap-5 self-start p-5 md:p-6">
          <FormField id="name" label="Nome" value={name} onChange={(e) => setName(e.target.value)} required />

          <div className="flex flex-col gap-2">
            <FormField
              id="slug"
              label="Slug (subdomínio)"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="meu-projeto"
              pattern="[a-z0-9][\-a-z0-9]*[a-z0-9]?"
              className="font-mono text-sm"
              required
            />
            <p className="text-text-3 text-xs">
              Ficará em <span className="text-muted-foreground font-mono">{projectHost(slug || "meu-projeto")}</span>
            </p>
          </div>

          <FormField
            id="repo"
            label="URL do repositório"
            value={repositoryUrl}
            onChange={(e) => setRepositoryUrl(e.target.value)}
            placeholder="https://github.com/usuario/repo.git"
            className="font-mono text-sm"
            required
          />

          <RootDirField id="root-dir" value={rootDir} onChange={setRootDir} state={rootDirState} />

          <div className="flex flex-col gap-2">
            <FormField
              id="build"
              label="Comando de build"
              value={effectiveBuild}
              onChange={(e) => setBuildCommand(e.target.value)}
              className="font-mono text-sm"
            />
            {detecting ? (
              <p className="text-text-3 flex items-center gap-2 text-xs">
                <Spinner className="size-3" /> Lendo o package.json…
              </p>
            ) : detected ? (
              <p className="text-good text-xs">Detectado do package.json{settledRootDir ? ` em ${settledRootDir}` : " do repositório"}.</p>
            ) : selectedRepo && detection && detection.candidates.length === 0 ? (
              <p className="text-text-3 text-xs">
                Nenhum script de build encontrado no package.json{settledRootDir ? ` de ${settledRootDir}` : ""}. Confira a pasta ou escreva o comando.
              </p>
            ) : ambiguousScripts.length > 1 ? (
              <fieldset className="flex flex-col gap-2">
                <legend className="text-text-3 mb-2 text-xs">O package.json tem mais de um script possível. Qual é o build?</legend>
                <div className="flex flex-wrap gap-2">
                  {ambiguousScripts.map((script) => {
                    const command = `npm run ${script.name}`;
                    const on = effectiveBuild === command;
                    return (
                      <button
                        key={script.name}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setBuildCommand(command)}
                        className={cn(
                          "chamfer-sm focus-ring px-3 py-1.5 font-mono text-xs transition-colors",
                          on ? "bg-primary text-primary-foreground" : "bg-raised text-muted-foreground hover:text-foreground",
                        )}
                      >
                        npm run {script.name}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ) : null}
            <p className="text-text-3 text-xs">
              O <span className="font-mono">npm install</span> roda antes, automaticamente: aqui vai só o build.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <FormField
              id="output"
              label="Pasta de saída"
              value={outputDir}
              onChange={(e) => setOutputDir(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-text-3 text-xs">Relativa à pasta do projeto.</p>
          </div>

          <SubmitButton
            size="lg"
            className="mt-1 w-full"
            pending={createProject.isPending}
            pendingLabel="Criando…"
            disabled={blocksSubmit(rootDirState)}
          >
            Criar projeto
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
