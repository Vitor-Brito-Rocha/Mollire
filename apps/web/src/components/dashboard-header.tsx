"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NotificationsToggle } from "@/components/notifications-toggle";
import { Button } from "@/components/ui/button";
import { api, type CurrentUser } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

export function DashboardHeader({ email }: { email: string }) {
  const router = useRouter();
  // role isn't in the Supabase session — fetched separately from our own API.
  // UX only: this just decides whether to render the admin link, the backend's
  // RolesGuard is the actual boundary.
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    api
      .get<CurrentUser>("/users/me")
      .then(setUser)
      .catch(() => undefined);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-border flex items-center justify-between border-b px-6 py-4">
      <Link href="/" className="text-lg font-semibold">
        Mollire
      </Link>
      <div className="flex items-center gap-4">
        <NotificationsToggle />
        {user?.role === "ADMIN" && (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/admin">Admin</Link>}
          />
        )}
        <span className="text-muted-foreground text-sm">{email}</span>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Sair
        </Button>
      </div>
    </header>
  );
}
