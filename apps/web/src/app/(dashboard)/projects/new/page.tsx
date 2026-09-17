"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError, type Project } from "@/lib/api";

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [buildCommand, setBuildCommand] = useState("npm install && npm run build");
  const [outputDir, setOutputDir] = useState("dist");
  const [loading, setLoading] = useState(false);

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
                // Hyphen placed right after `[` — inside a class it's always
                // literal there in every regex flag mode; at the end (as in
                // `[a-z0-9-]`) some browsers now parse `pattern` more like
                // the newer `v`-flag regex mode and reject it.
                pattern="[a-z0-9][-a-z0-9]*[a-z0-9]?"
                required
              />
              <p className="text-muted-foreground text-xs">
                Ficará disponível em {slug || "slug"}.aulvi.com.br
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="repo">Repositório git</Label>
              <Input
                id="repo"
                value={repositoryUrl}
                onChange={(event) => setRepositoryUrl(event.target.value)}
                placeholder="https://github.com/usuario/repo.git"
                required
              />
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
