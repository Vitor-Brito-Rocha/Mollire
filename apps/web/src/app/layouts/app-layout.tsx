import { Outlet, useLocation } from "react-router";
import { GridBeams } from "@/shared/components/grid-beams";
import { useTheme } from "@/shared/hooks/use-theme";
import { MobileBar, SideRail } from "./side-rail";

// O shell de toda tela com menu (públicas e logadas): coluna da esquerda no
// desktop, barra no topo no celular; só o que está dentro do <Outlet /> troca
// de rota em rota — e entra com um fade curto, para a troca não ser um corte.
export default function AppLayout() {
  const { pathname } = useLocation();
  // As cores dos feixes são lidas na montagem: trocar o tema remonta o canvas.
  const { theme } = useTheme();

  return (
    <div className="flex min-h-screen">
      <SideRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileBar />
        <main className="hud-grid flex flex-1 flex-col px-5 py-8 md:px-10 md:py-10">
          {/* Preso à janela e à direita da barra lateral: nunca por baixo do desfoque dela. */}
          <GridBeams key={theme} fixed className="md:left-[232px]" />
          <div key={pathname} className="route-enter flex flex-1 flex-col">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
