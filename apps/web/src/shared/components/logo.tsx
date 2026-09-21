// Marca do Mollire no vocabulário do HUD: um quadrado chanfrado (o mesmo corte
// dos botões e selos) com uma seta para cima vazada — publicar, subir de nível.
// É SVG e herda a cor do texto, então acompanha o acento do tema e escala do
// favicon ao hero sem perder nitidez. Os PNGs da chama continuam em
// public/brand/ caso a marca antiga volte.
export function Logo({ className, height = 32 }: { className?: string; height?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={height}
      height={height}
      role="img"
      aria-label="Mollire"
      className={`text-primary shrink-0 ${className ?? ""}`}
      style={{ filter: "drop-shadow(0 0 8px var(--glow))" }}
    >
      <path fill="currentColor" d="M7 0h17v17l-7 7H0V7z" />
      <path fill="var(--background)" d="M12 5.5l7.5 7.5-2.6 2.6L12 10.7l-4.9 4.9L4.5 13z" />
    </svg>
  );
}
