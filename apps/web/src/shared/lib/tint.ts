// A cor de um projeto sem captura: derivada do slug, estável entre telas.
const TINTS = ["#5ee2ff", "#9b7bff", "#4de38a", "#ffb020"] as const;

export function tintFor(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  return TINTS[hash % TINTS.length];
}
