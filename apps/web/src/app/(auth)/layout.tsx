import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
      <Link href="/" className="flex flex-col items-center gap-2">
        <Logo height={56} />
        <span className="text-xl font-semibold">Mollire</span>
      </Link>
      {children}
    </div>
  );
}
