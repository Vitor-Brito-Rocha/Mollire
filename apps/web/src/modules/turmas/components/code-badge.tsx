import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// O código de entrada da turma, com um clique para copiar: é o que o
// professor manda no grupo da sala.
export function CodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Código copiado");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Não foi possível copiar. O código é " + code);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="Copiar o código da turma"
      className="surface focus-ring hover:border-line-2 flex items-center gap-3 px-3 py-1.5 transition-colors"
    >
      <span className="label text-text-3 text-micro">Código</span>
      <span className="font-mono text-body-lg font-semibold tracking-[0.18em]">{code}</span>
      {copied ? <Check className="text-good size-4" aria-hidden="true" /> : <Copy className="text-text-3 size-4" aria-hidden="true" />}
    </button>
  );
}
