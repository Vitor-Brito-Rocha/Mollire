import { Outlet, useNavigation } from "react-router";

// Lazy routes keep the old screen up while the next chunk loads; this thin bar
// is the only sign anything is happening.
function NavigationProgress() {
  const { state } = useNavigation();
  if (state === "idle") return null;
  return (
    <div role="progressbar" aria-label="Carregando página" className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden">
      <div className="bg-primary h-full w-1/3 animate-[nav-progress_1s_ease-in-out_infinite]" />
    </div>
  );
}

export default function RootLayout() {
  return (
    <>
      <NavigationProgress />
      <Outlet />
    </>
  );
}
