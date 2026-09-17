"use client";

import Link from "next/link";
import { HudHeader } from "@/components/hud-header";
import { LevelBar } from "@/components/level-bar";
import { Button } from "@/components/ui/button";
import type { CurrentUser } from "@/lib/api";

// Header das telas públicas: barra de nível e avatar para quem está logado,
// botão Entrar para quem não está.
export function GalleryHeader({ user }: { user: CurrentUser | null }) {
  return (
    <HudHeader>
      {user ? (
        <>
          <LevelBar level={user.level} xp={user.xp} next={user.next} className="hidden sm:flex" />
          <Link
            href="/perfil"
            aria-label="Seu perfil"
            className="hex bg-raised font-display text-muted-foreground hover:text-foreground grid size-[34px] place-items-center text-xs font-bold uppercase transition-colors"
          >
            {(user.handle ?? user.email).charAt(0)}
          </Link>
        </>
      ) : (
        <Button size="sm" nativeButton={false} render={<Link href="/login">Entrar</Link>} />
      )}
    </HudHeader>
  );
}
