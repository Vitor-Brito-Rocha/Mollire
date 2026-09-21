import { useCallback, type PointerEvent } from "react";

// Guarda a posição do ponteiro em --mx/--my no próprio elemento; o filho
// .spot-glow desenha o brilho ali. Sem estado React: nada re-renderiza.
export function useSpotlight() {
  return useCallback((event: PointerEvent<HTMLElement>) => {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    target.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    target.style.setProperty("--my", `${event.clientY - rect.top}px`);
  }, []);
}
