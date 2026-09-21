import { cn } from "@/shared/lib/utils";

type PanelProps = {
  title?: string;
  // Small mono number next to the title (rows, members…). Hidden when undefined.
  count?: number;
  // Something on the right of the title row (a switch, a link).
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

// A superfície de todo bloco de conteúdo: translúcida, com fio de luz no topo
// e sombra embaixo. As ferragens de canto ficaram só para o que é destaque.
export function Panel({ title, count, aside, className, children }: PanelProps) {
  return (
    <section className={cn("surface flex flex-col", className)}>
      {title && (
        <h2 className="label border-border flex items-center gap-2 border-b px-4 py-3">
          {title}
          {count !== undefined && (
            <span className="text-text-3 font-mono text-xs tracking-normal normal-case">{count}</span>
          )}
          {aside && <span className="ml-auto font-sans tracking-normal normal-case">{aside}</span>}
        </h2>
      )}
      {children}
    </section>
  );
}
