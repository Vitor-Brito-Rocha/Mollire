"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
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

  // Mesmo shell das telas de tenant: o admin é uma seção do app, não outro app.
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader email={user.email} />
      <main className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col gap-6 p-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-2.5">
            <span className="label text-primary flex items-center gap-2.5 tracking-[0.14em]">
              <span className="bg-primary h-0.5 w-[18px]" />
              Admin
            </span>
            <h1 className="font-display text-[34px] leading-[1.1] font-bold">Console</h1>
            <p className="text-muted-foreground text-[15px]">
              Todos os projetos e deploys, de todos os tenants — somente leitura, exceto quem é admin.
            </p>
          </div>
          <nav className="bg-card border-border inline-flex gap-0.5 border p-[3px]" aria-label="Seções do admin">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={
                    "label inline-flex min-h-[38px] items-center px-3.5 transition-colors " +
                    (active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        {children}
      </main>
    </div>
  );
}
