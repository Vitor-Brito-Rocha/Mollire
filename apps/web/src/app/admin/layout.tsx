"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "cn";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type CurrentUser } from "@/lib/api";

const NAV_ITEMS = [
  { href: "/admin", label: "Projetos" },
  { href: "/admin/admins", label: "Admins" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // UX gate only — the actual boundary is the backend's RolesGuard on every
  // /admin/* route. A tenant redirected here client-side never had a way to
  // fetch the data in the first place.
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    api
      .get<CurrentUser>("/users/me")
      .then((current) => {
        setUser(current);
        if (current.role !== "ADMIN") router.replace("/");
      })
      .catch(() => router.replace("/"))
      .finally(() => setChecked(true));
  }, [router]);

  if (!checked || user?.role !== "ADMIN") {
    return (
      <div className="p-6">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <div>
        <Link href="/" className="text-muted-foreground text-sm underline underline-offset-4">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Admin</h1>
        <nav className="mt-4 flex gap-4 border-b">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "border-b-2 border-transparent pb-2 text-sm font-medium text-muted-foreground transition-colors",
                pathname === item.href && "border-primary text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
