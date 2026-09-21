// Contrato proposto para o back (ver docs/design-system.md e a memória de
// ideias): a API devolve fatos por código; o texto, o ícone e o destino de
// cada item ficam no front (lib/catalog.ts). Enquanto os endpoints não
// existem, os hooks falham em silêncio e os blocos não aparecem.

export type QuestCode =
  | "connect_github"
  | "create_project"
  | "first_deploy"
  | "publish_gallery"
  | "give_star"
  | "invite_member"
  | "add_env_var";

// GET /users/me/quests
export type QuestsResponse = {
  quests: { code: QuestCode; xp: number; completed_at: string | null }[];
  completed: number;
  total: number;
};

export type AchievementCode =
  | "first_deploy"
  | "ten_deploys"
  | "first_star"
  | "fast_deploy"
  | "rollback"
  | "collaborator"
  | "uptime_30";

// GET /users/me/achievements  |  GET /users/:handle/achievements (só as desbloqueadas)
export type Achievement = {
  code: AchievementCode;
  unlocked_at: string | null;
  // Para as que contam algo (10 deploys, 30 dias no ar).
  progress?: { current: number; target: number };
};

export type XpReason =
  | "DEPLOY"
  | "FIRST_DEPLOY"
  | "PUBLISH"
  | "STAR_RECEIVED"
  | "QUEST"
  | "ACHIEVEMENT"
  | "HELPFUL_COMMENT";

// GET /users/me/xp/history?limit=20
export type XpEvent = {
  id: string;
  amount: number;
  reason: XpReason;
  // O que gerou o XP, para o texto e o link: projeto (slug, name) ou pessoa (handle).
  ref: { project?: { slug: string; name: string }; handle?: string } | null;
  created_at: string;
};

// GET /xp/rules (público): quanto vale cada motivo. O texto fica no catálogo.
export type XpRule = { code: XpReason; xp: number };

// Moldura da insígnia do nível: escolha do usuário entre as que o nível dele
// libera (PATCH /users/me { frame }). Ids conhecidos em lib/catalog.ts.
export type FrameId = "default" | "bronze" | "silver" | "gold" | "violet";
