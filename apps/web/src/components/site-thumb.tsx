import { apiUrl } from "@/lib/api";

// Miniatura de um site publicado: a captura real quando existe; senão, um
// desenho de site genérico, escolhido pelo slug para variar entre os cards.
const LOOKS = {
  sky: { bg: "linear-gradient(160deg,#3b82f6,#7dd3fc)", fg: "#ffffff", btn: "#ffffff" },
  dark: { bg: "linear-gradient(170deg,#0f172a,#1e293b)", fg: "#e2e8f0", btn: "#6366f1" },
  light: { bg: "#ffffff", fg: "#0f172a", btn: "#10b981" },
  warm: { bg: "linear-gradient(165deg,#fff7ed,#fed7aa)", fg: "#7c2d12", btn: "#ea580c" },
} as const;
type Look = keyof typeof LOOKS;
const LOOK_KEYS = Object.keys(LOOKS) as Look[];

function lookFor(slug: string): Look {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  return LOOK_KEYS[hash % LOOK_KEYS.length];
}

export function SiteThumb({
  slug,
  thumbnailUrl,
  name,
}: {
  slug: string;
  thumbnailUrl: string | null;
  name: string;
}) {
  if (thumbnailUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- served by the API, per-project
      <img src={apiUrl(thumbnailUrl)} alt={`Captura de ${name}`} className="h-full w-full object-cover object-top" />
    );
  }

  const l = LOOKS[lookFor(slug)];
  return (
    <div className="flex h-full flex-col" style={{ background: l.bg, color: l.fg }} aria-hidden="true">
      <div className="flex items-center gap-1.5 px-3 py-2">
        <span className="h-[7px] w-5 rounded-[3px] bg-current opacity-85" />
        <span className="h-[5px] w-[13px] rounded-sm bg-current opacity-35" />
        <span className="h-[5px] w-[13px] rounded-sm bg-current opacity-35" />
        <span className="h-[5px] w-[13px] rounded-sm bg-current opacity-35" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-3 py-1.5">
        <span className="h-[11px] w-3/4 rounded-[3px] bg-current opacity-80" />
        <span className="h-[11px] w-1/2 rounded-[3px] bg-current opacity-80" />
        <span className="h-[5px] w-[88%] rounded-sm bg-current opacity-30" />
        <span className="mt-1 h-3.5 w-[54px] rounded-[7px]" style={{ background: l.btn }} />
      </div>
      <div className="flex gap-1.5 px-3 pb-3">
        <span className="h-7 flex-1 rounded-[5px] bg-current opacity-16" />
        <span className="h-7 flex-1 rounded-[5px] bg-current opacity-16" />
        <span className="h-7 flex-1 rounded-[5px] bg-current opacity-16" />
      </div>
    </div>
  );
}
