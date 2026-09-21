import { SiteThumb } from "@/shared/components/site-thumb";
import { tintFor } from "@/shared/lib/tint";
import { cn } from "@/shared/lib/utils";

type CoverBannerProps = {
  slug: string;
  thumbnailUrl: string | null;
  name: string;
  className?: string;
  contentClassName?: string;
  // Recebe a cor do projeto, para o que quiser acompanhá-la (o eyebrow).
  children: React.ReactNode | ((tint: string) => React.ReactNode);
};

// Banner de launcher: a capa do projeto (captura real, ou a inicial gigante
// na cor dele) atrás, dois degradês por cima para o texto respirar, e as
// ferragens de canto na cor do projeto. O conteúdo é de quem chama.
export function CoverBanner({ slug, thumbnailUrl, name, className, contentClassName, children }: CoverBannerProps) {
  const tint = tintFor(slug);

  return (
    <section
      className={cn("corners border-border relative flex border", className)}
      style={{ "--corner": tint } as React.CSSProperties}
    >
      <div className="absolute inset-0" aria-hidden="true">
        <SiteThumb slug={slug} thumbnailUrl={thumbnailUrl} name={name} size="banner" />
      </div>
      <div className="from-background via-background/85 to-background/20 absolute inset-0 bg-gradient-to-r" aria-hidden="true" />
      <div className="from-background/80 absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t to-transparent" aria-hidden="true" />
      <div className={cn("relative flex w-full flex-col p-6 md:p-8", contentClassName)}>
        {typeof children === "function" ? children(tint) : children}
      </div>
    </section>
  );
}
