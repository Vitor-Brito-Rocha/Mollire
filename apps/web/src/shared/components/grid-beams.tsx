import { useEffect, useRef } from "react";
import { cn } from "@/shared/lib/utils";

// Feixes de luz correndo pelas linhas da malha de fundo — o detalhe que faz a
// tela parecer ligada, e não um print. Canvas leve: poucos feixes, só as
// faixas por onde eles passaram são limpas a cada quadro, pausa fora da aba,
// e nada se mexe para quem pediu menos movimento no sistema.
const CELL = 32;

type Beam = {
  axis: "x" | "y";
  line: number;
  pos: number;
  len: number;
  speed: number;
  color: string;
  alpha: number;
};

type GridBeamsProps = {
  className?: string;
  density?: number;
  // `fixed`: preso à janela, não à página. Numa tela longa, o canvas fica do
  // tamanho da janela em vez de cobrir toda a rolagem.
  fixed?: boolean;
};

// A faixa que um feixe ocupa (com folga para a ponta e a espessura).
function rectOf(beam: Beam): [number, number, number, number] {
  const tail = beam.pos - beam.len;
  return beam.axis === "x" ? [tail - 2, beam.line - 3, beam.len + 8, 6] : [beam.line - 3, tail - 2, 6, beam.len + 8];
}

export function GridBeams({ className, density = 7, fixed = false }: GridBeamsProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const styles = getComputedStyle(canvas);
    const primary = styles.getPropertyValue("--primary").trim() || "#5ee2ff";
    const gold = styles.getPropertyValue("--gold").trim() || "#f2c14e";

    let width = 0;
    let height = 0;
    let beams: Beam[] = [];
    let raf = 0;
    let last = 0;

    const spawn = (): Beam => {
      const axis: Beam["axis"] = Math.random() < 0.6 ? "x" : "y";
      const lines = Math.max(1, Math.floor((axis === "x" ? height : width) / CELL));
      const travel = axis === "x" ? width : height;
      return {
        axis,
        line: Math.floor(Math.random() * lines) * CELL + 0.5,
        pos: -Math.random() * travel,
        len: 90 + Math.random() * 180,
        speed: 55 + Math.random() * 95,
        color: Math.random() < 0.12 ? gold : primary,
        alpha: 0.3 + Math.random() * 0.35,
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      // Mudar o tamanho limpa o canvas inteiro; os feixes seguem de onde estavam.
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (beams.length === 0) beams = Array.from({ length: density }, spawn);
    };

    const draw = (dt: number) => {
      // Primeiro apaga onde todos estavam, depois desenha todos: dois feixes na
      // mesma linha não apagam um ao outro.
      for (const beam of beams) ctx.clearRect(...rectOf(beam));

      for (const beam of beams) {
        beam.pos += beam.speed * dt;
        const travel = beam.axis === "x" ? width : height;
        if (beam.pos - beam.len > travel) Object.assign(beam, spawn(), { pos: -beam.len });

        const tail = beam.pos - beam.len;
        const gradient =
          beam.axis === "x"
            ? ctx.createLinearGradient(tail, 0, beam.pos, 0)
            : ctx.createLinearGradient(0, tail, 0, beam.pos);
        gradient.addColorStop(0, "rgba(0,0,0,0)");
        gradient.addColorStop(1, beam.color);
        ctx.globalAlpha = beam.alpha;
        ctx.fillStyle = gradient;
        if (beam.axis === "x") {
          ctx.fillRect(tail, beam.line - 0.5, beam.len, 1);
          ctx.fillStyle = beam.color;
          ctx.fillRect(beam.pos - 5, beam.line - 1, 5, 2);
        } else {
          ctx.fillRect(beam.line - 0.5, tail, 1, beam.len);
          ctx.fillStyle = beam.color;
          ctx.fillRect(beam.line - 1, beam.pos - 5, 2, 5);
        }
      }
      ctx.globalAlpha = 1;
    };

    const tick = (time: number) => {
      // Quadro longo (aba voltando, máquina ocupada) não teleporta os feixes.
      const dt = last ? Math.min(0.05, (time - last) / 1000) : 0;
      last = time;
      draw(dt);
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf) return;
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [density]);

  // O invólucro é quem se estica por left/right: <canvas> é elemento substituído
  // e ficaria no tamanho intrínseco (300×150) se recebesse o inset direto.
  return (
    <div aria-hidden="true" className={cn("pointer-events-none inset-0 -z-10", fixed ? "fixed" : "absolute", className)}>
      <canvas ref={ref} className="block h-full w-full" />
    </div>
  );
}
