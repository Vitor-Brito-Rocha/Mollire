"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HudHeader } from "@/components/hud-header";
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

  // A barra de nível entra aqui quando a API passar a expor XP — o componente
  // já existe em level-bar.tsx; o que falta é o dado, não a tela.
  return (
    <HudHeader>
      <NotificationsToggle />
      {user?.role === "ADMIN" && (
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/admin">Admin</Link>}
        />
      )}
      <span className="text-text-3 hidden font-mono text-xs sm:inline">{email}</span>
      <span className="hex bg-raised font-display text-muted-foreground grid size-[34px] place-items-center text-xs font-bold uppercase">
        {email.charAt(0) || "?"}
      </span>
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        Sair
      </Button>
    </HudHeader>
  );
}
