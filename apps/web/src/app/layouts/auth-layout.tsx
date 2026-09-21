import { Link, Outlet } from "react-router";
import { Logo } from "@/shared/components/logo";

export default function AuthLayout() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
      <Link
        to="/"
        className="font-display flex items-center gap-2.5 text-base font-bold tracking-[0.12em] uppercase"
      >
        <Logo height={28} />
        Mollire
      </Link>
      <Outlet />
    </div>
  );
}
