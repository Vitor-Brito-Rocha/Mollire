import { Link } from "react-router";
import { cn } from "@/shared/lib/utils";
import { Eyebrow } from "@/shared/components/eyebrow";

function ChevronLeft() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-3.5"
      style={{ fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}
    >
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

// The "‹ Seus projetos" link above a screen's title.
export function BackLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="label text-muted-foreground hover:text-foreground flex w-fit items-center gap-2 transition-colors"
    >
      <ChevronLeft />
      {children}
    </Link>
  );
}

type PageHeaderProps = {
  title: string;
  // Small accent label above the title ("Painel").
  eyebrow?: string;
  // Link above the title, back to the parent screen.
  back?: { to: string; label: string };
  description?: React.ReactNode;
  // Chips / links under the title.
  meta?: React.ReactNode;
  // Right side: buttons.
  actions?: React.ReactNode;
  className?: string;
};

// Title block of a screen: [eyebrow | back link] / title / description / meta,
// with the primary actions on the right. Every module's screens start with it.
export function PageHeader({ title, eyebrow, back, description, meta, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-6", className)}>
      <div className="flex min-w-0 flex-col gap-2.5">
        {back && <BackLink to={back.to}>{back.label}</BackLink>}
        {eyebrow && (
          <Eyebrow>{eyebrow}</Eyebrow>
        )}
        <h1 className="font-display text-display font-bold tracking-display md:text-display-lg">{title}</h1>
        {description && <p className="text-muted-foreground max-w-[60ch] text-base leading-relaxed">{description}</p>}
        {meta && <div className="flex flex-wrap items-center gap-3">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
