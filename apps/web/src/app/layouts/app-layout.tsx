import { Outlet } from "react-router";
import { GridBeams } from "@/shared/components/grid-beams";
import { MobileBar, SideRail } from "./side-rail";

// O shell de toda tela com menu (públicas e logadas): coluna da esquerda no
// desktop, barra no topo no celular; só o que está dentro do <Outlet /> troca
// de rota em rota. Cada tela define apenas a largura do próprio conteúdo.
export default function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <SideRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileBar />
        <main className="hud-grid flex flex-1 flex-col px-5 py-8 md:px-10 md:py-10">
          <GridBeams />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
