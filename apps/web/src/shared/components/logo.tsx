import { useId } from "react";

// A marca completa usa os tokens dos temas da aplicação: as letras seguem
// o texto principal, enquanto o símbolo combina o fundo com a cor de destaque.
export function Logo({ className, height = 24 }: { className?: string; height?: number }) {
  const glowId = `logo-glow-${useId().replaceAll(":", "")}`;

  return (
    <svg
      viewBox="0 0 321 57"
      width={(321 / 57) * height}
      height={height}
      fill="none"
      role="img"
      aria-label="Mollire"
      className={`shrink-0 ${className ?? ""}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter
          id={glowId}
          x="-80%"
          y="-80%"
          width="260%"
          height="260%"
          colorInterpolationFilters="sRGB"
        >
          <feDropShadow
            in="SourceGraphic"
            dx="0"
            dy="0"
            stdDeviation="3"
            floodColor="var(--primary)"
            floodOpacity="0.9"
            result="nearGlow"
          />
          <feDropShadow
            in="SourceGraphic"
            dx="0"
            dy="0"
            stdDeviation="7"
            floodColor="var(--primary)"
            floodOpacity="0.48"
            result="farGlow"
          />
          <feMerge>
            <feMergeNode in="farGlow" />
            <feMergeNode in="nearGlow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M5.55114 2.13636H19.2045L33.625 37.3182H34.2386L48.6591 2.13636H62.3125V54.5H51.5739V20.4176H51.1392L37.5881 54.2443H30.2756L16.7244 20.2898H16.2898V54.5H5.55114V2.13636Z"
        fill="var(--foreground)"
      />
      <rect width="56" height="56" transform="translate(67 0.5)" fill="var(--background)" />
      <path
        d="M112.5 0.5H77.5C71.701 0.5 67 5.20101 67 11V46C67 51.799 71.701 56.5 77.5 56.5H112.5C118.299 56.5 123 51.799 123 46V11C123 5.20101 118.299 0.5 112.5 0.5Z"
        fill="var(--background)"
      />
      <path
        d="M86.25 7.5H116V37.25L103.75 49.5H74V19.75L86.25 7.5Z"
        fill="var(--primary)"
        filter={`url(#${glowId})`}
      />
      <path
        d="M95 17.125L108.125 30.25L103.575 34.8L95 26.225L86.425 34.8L81.875 30.25L95 17.125Z"
        fill="var(--background)"
      />
      <path
        d="M127.551 54.5V2.13636H138.622V45.3722H161.071V54.5H127.551ZM169.303 54.5V2.13636H180.374V45.3722H202.823V54.5H169.303ZM222.125 2.13636V54.5H211.054V2.13636H222.125ZM232.134 54.5V2.13636H252.793C256.748 2.13636 260.123 2.84375 262.918 4.25852C265.731 5.65625 267.87 7.64204 269.336 10.2159C270.819 12.7727 271.56 15.7812 271.56 19.2415C271.56 22.7187 270.81 25.7102 269.31 28.2159C267.81 30.7045 265.637 32.6136 262.79 33.9432C259.961 35.2727 256.535 35.9375 252.512 35.9375H238.679V27.0398H250.722C252.836 27.0398 254.591 26.75 255.989 26.1705C257.387 25.5909 258.427 24.7216 259.108 23.5625C259.807 22.4034 260.157 20.9631 260.157 19.2415C260.157 17.5028 259.807 16.0369 259.108 14.8438C258.427 13.6506 257.378 12.7472 255.963 12.1335C254.566 11.5028 252.802 11.1875 250.671 11.1875H243.205V54.5H232.134ZM260.412 30.6705L273.427 54.5H261.205L248.472 30.6705H260.412ZM280.284 54.5V2.13636H315.568V11.2642H291.355V23.7415H313.753V32.8693H291.355V45.3722H315.67V54.5H280.284Z"
        fill="var(--foreground)"
      />
    </svg>
  );
}
