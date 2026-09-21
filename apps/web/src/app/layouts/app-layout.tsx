import { Outlet, useLocation } from "react-router";
import { GridBeams } from "@/shared/components/grid-beams";
import { MobileBar, SideRail } from "./side-rail";

// O shell de toda tela com menu (públicas e logadas): coluna da esquerda no
// desktop, barra no topo no celular; só o que está dentro do <Outlet /> troca
// de rota em rota — e entra com um fade curto, para a troca não ser um corte.
export default function AppLayout() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen">
      <SideRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileBar />
        <main className="hud-grid flex flex-1 flex-col px-5 py-8 md:px-10 md:py-10">
          <GridBeams />
          <div key={pathname} className="route-enter flex flex-1 flex-col">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
