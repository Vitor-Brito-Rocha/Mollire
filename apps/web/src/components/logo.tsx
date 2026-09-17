import Image from "next/image";

const ICON_ASPECT_RATIO = 226 / 287;

// The app's background is always the light theme (there's no dark-mode
// toggle wired up yet, so .dark never applies) — icon-light is the only
// variant that reads correctly against it. icon-dark is reserved for
// contexts the OS controls directly, like the favicon (see layout.tsx).
export function Logo({ className, height = 32 }: { className?: string; height?: number }) {
  const width = Math.round(height * ICON_ASPECT_RATIO);
  return (
    <Image
      src="/brand/icon-light.png"
      alt="Mollire"
      width={width}
      height={height}
      className={className}
      style={{ width, height }}
      priority
    />
  );
}
