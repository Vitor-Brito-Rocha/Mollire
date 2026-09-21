import { Star } from "lucide-react";
import { Link } from "react-router";
import { useGalleryProjects } from "@/modules/gallery";
import { GridBeams } from "@/shared/components/grid-beams";
import { SiteThumb } from "@/shared/components/site-thumb";
import { formatNumber } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";

const STEPS = [
  { n: "01", title: "Conecte o repositório", text: "GitHub ou qualquer URL git público." },
  { n: "02", title: "Cada push vira um deploy", text: "Build isolado, log ao vivo, rollback por commit." },
  { n: "03", title: "Seu site no ar", text: "{seu-projeto}.aulvi.com.br, com HTTPS, em minutos." },
];

// A metade "de vitrine" das telas de entrada: o que o Mollire é, em três
// linhas, e o que a comunidade acabou de publicar — dados reais da galeria,
// que é pública. Se a galeria não responder, a faixa simplesmente não aparece.
export function AuthShowcase({ className }: { className?: string }) {
  const { data: projects } = useGalleryProjects("recentes", { silent: true });
  const recent = projects?.slice(0, 3) ?? [];

  return (
    <section
      className={cn(
        "hud-grid bg-card/40 border-border relative flex-col justify-between gap-12 overflow-hidden border-r p-8 lg:p-12 xl:p-16",
        className,
      )}
    >
      <GridBeams density={10} />

      <span className="label text-primary flex items-center gap-2.5 tracking-[0.14em]">
        <span className="bg-primary h-0.5 w-[18px]" />
        Deploy de sites estáticos, com XP
      </span>

      <div className="flex flex-col gap-10">
        <h1 className="font-display text-[44px] leading-[0.98] font-bold tracking-[-0.01em] uppercase lg:text-[58px] xl:text-[68px]">
          Publique.
          <br />
          <span className="text-gold">Receba estrelas.</span>
          <br />
          <span className="text-primary">Suba de nível.</span>
        </h1>
        <ol className="grid gap-5 lg:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.n} className="border-border flex flex-col gap-1.5 border-l-2 pl-4">
              <span className="text-primary font-mono text-xs">{step.n}</span>
              <span className="text-[15px] font-semibold">{step.title}</span>
              <span className="text-muted-foreground text-[13px] leading-snug">{step.text}</span>
            </li>
          ))}
        </ol>
      </div>

      {recent.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="label text-text-3 flex items-center gap-2.5">
            <span className="bg-line-2 h-0.5 w-[18px]" />
            Publicados recentemente
          </span>
          <ul className="grid grid-cols-3 gap-3">
            {recent.map((project) => (
              <li key={project.id}>
                <Link
                  to={`/galeria/${project.slug}`}
                  className="surface hover:border-line-2 flex flex-col overflow-hidden transition-colors"
                >
                  <span className="block aspect-[16/10] overflow-hidden">
                    <SiteThumb slug={project.slug} thumbnailUrl={project.thumbnail_url} name={project.name} size="thumb" />
                  </span>
                  <span className="flex items-center justify-between gap-2 px-3 py-2">
                    <span className="truncate text-[13px] font-semibold">{project.name}</span>
                    <span className="text-gold flex shrink-0 items-center gap-1 font-mono text-[11px]">
                      <Star className="size-3 fill-current" />
                      {formatNumber(project.stars)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
