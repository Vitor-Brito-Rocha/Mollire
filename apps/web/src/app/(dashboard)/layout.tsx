"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type CurrentUser } from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  // The session is an httpOnly cookie only the API can see, so "am I logged in"
  // is asked of the API. UX gate only — every /projects/* route is guarded
  // server-side anyway. Children render once this passes, so no page fires
  // unauthenticated calls first.
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    api
      .get<CurrentUser>("/users/me")
      .then(setUser)
      .catch(() => router.replace("/login"));
  }, [router]);

  if (!user) {
    return (
      <div className="p-6">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader email={user.email} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
