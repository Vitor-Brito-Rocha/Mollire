"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HudHeader } from "@/components/hud-header";
import { LevelBar } from "@/components/level-bar";
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
    <HudHeader>
      {user && <LevelBar level={user.level} xp={user.xp} next={user.next} className="hidden sm:flex" />}
      <NotificationsToggle />
      {user?.role === "ADMIN" && (
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/admin">Admin</Link>}
        />
      )}
      {/* O avatar leva ao perfil, onde o apelido público é escolhido. */}
      <Link
        href="/perfil"
        aria-label="Seu perfil"
        className="hex bg-raised font-display text-muted-foreground hover:text-foreground grid size-[34px] place-items-center text-xs font-bold uppercase transition-colors"
      >
        {(user?.handle ?? email).charAt(0) || "?"}
      </Link>
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        Sair
      </Button>
    </HudHeader>
  );
}
