import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
      <Link
        href="/"
        className="font-display flex items-center gap-2.5 text-base font-bold tracking-[0.12em] uppercase"
      >
        <Logo height={28} />
        Mollire
      </Link>
      {children}
    </div>
  );
}
