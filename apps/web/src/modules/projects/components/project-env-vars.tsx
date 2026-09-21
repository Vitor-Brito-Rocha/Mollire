import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import { http, ApiError } from "@/shared/lib/http";
import type { EnvVar } from "../types";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

export function ProjectEnvVars({ slug }: { slug: string }) {
  const [vars, setVars] = useState<EnvVar[] | null>(null);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  function reload() {
    return http
      .get<EnvVar[]>(`/projects/${slug}/env`)
      .then(setVars)
      .catch(() => undefined);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await http.put(`/projects/${slug}/env/${key}`, { value });
      toast.success(`${key} salvo`);
      setKey("");
      setValue("");
      await reload();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Erro ao salvar variável");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(varKey: string) {
    try {
      await http.delete(`/projects/${slug}/env/${varKey}`);
      toast.success(`${varKey} removido`);
      await reload();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Erro ao remover variável");
    }
  }

  if (vars === null) return <Skeleton className="h-40 w-full" />;

  return (
    <section className="corners bg-card border-border flex flex-col border">
      <h2 className="label border-border flex items-center gap-2 border-b px-4 py-3">
        Variáveis de ambiente
        {vars.length > 0 && (
          <span className="text-text-3 font-mono text-xs tracking-normal normal-case">{vars.length}</span>
        )}
      </h2>

      {vars.length > 0 && (
        <ul className="flex flex-col">
          {vars.map((v) => (
            <li key={v.key} className="border-border flex items-center gap-3 border-b px-4 py-2.5">
              <span className="min-w-0 flex-1 truncate font-mono text-xs">{v.key}</span>
              <span className="text-text-3 shrink-0 text-xs">
                {dateFmt.format(new Date(v.updated_at))}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(v.key)}
                className="text-text-3 hover:text-destructive shrink-0 text-xs underline underline-offset-4"
              >
                remover
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-2 p-4">
        <div className="flex flex-col gap-2">
          <Input
            value={key}
            onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
            placeholder="NOME_DA_VARIAVEL"
            className="font-mono text-xs"
            required
          />
          <Input
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="valor"
            className="font-mono text-xs"
            required
          />
        </div>
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? "Salvando..." : "Salvar variável"}
        </Button>
        <p className="text-text-3 text-xs">
          Valores não são exibidos após salvos. Para atualizar, salve novamente com a mesma chave.
        </p>
      </form>
    </section>
  );
}
