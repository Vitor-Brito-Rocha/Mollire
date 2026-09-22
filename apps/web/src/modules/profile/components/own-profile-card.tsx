import { Link } from "react-router";
import type { CurrentUser } from "@/modules/auth";
import { frameColor } from "@/modules/progress";
import { LevelInsignia } from "@/shared/components/level-insignia";
import { formatNumber } from "@/shared/lib/format";
import { levelTitle } from "@/shared/lib/level";
import { Button } from "@/shared/ui/button";

// O topo do seu perfil: a insígnia e o apelido como a galeria os vê. O apelido
// em si se troca nas configurações; aqui é só o jogador.
export function OwnProfileCard({ user }: { user: CurrentUser }) {
  return (
    <div className="surface corners flex flex-wrap items-center gap-5 p-5">
      <LevelInsignia level={user.level} size="lg" color={frameColor(user.frame, user.level)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="font-display text-title-lg tracking-display truncate font-bold">
          {user.handle ? `@${user.handle}` : "Sem apelido"}
        </span>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="label text-text-3 text-mini">{levelTitle(user.level)}</span>
          <span className="text-border">·</span>
          <span className="font-mono">{formatNumber(user.xp)} XP</span>
        </div>
      </div>
      <div className="flex flex-col items-start gap-2 sm:items-end">
        {user.handle && (
          <Button variant="outline" size="sm" nativeButton={false} render={<Link to={`/u/${user.handle}`}>Ver como os outros veem</Link>} />
        )}
        <Link to="/configuracoes" className="text-text-3 hover:text-foreground text-xs underline underline-offset-4 transition-colors">
          {user.handle ? "Trocar apelido" : "Escolher apelido"}
        </Link>
      </div>
    </div>
  );
}
