import {
  Clock,
  GitBranch,
  Globe,
  KeyRound,
  PlusSquare,
  RotateCcw,
  Rocket,
  Star,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import type { AchievementCode, QuestCode, XpReason } from "../types";

type Icon = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

// O texto de cada missão, o ícone e onde ela se cumpre. O back só diz se foi feita.
export const QUESTS: Record<QuestCode, { title: string; hint: string; icon: Icon; href: string }> = {
  connect_github: { title: "Conectar GitHub", hint: "Conecte sua conta do GitHub no perfil", icon: GitBranch, href: "/perfil" },
  create_project: { title: "Criar projeto", hint: "Crie seu primeiro projeto", icon: PlusSquare, href: "/projects/new" },
  first_deploy: { title: "Primeiro deploy", hint: "Faça o primeiro deploy de um projeto", icon: Rocket, href: "/" },
  publish_gallery: { title: "Publicar", hint: "Publique um projeto na galeria", icon: Globe, href: "/" },
  give_star: { title: "Dar uma estrela", hint: "Dê uma estrela num projeto da galeria", icon: Star, href: "/galeria" },
  invite_member: { title: "Convidar alguém", hint: "Convide alguém para um projeto seu", icon: Users, href: "/" },
  add_env_var: { title: "Criar variável", hint: "Crie uma variável de ambiente num projeto", icon: KeyRound, href: "/" },
};

export const ACHIEVEMENTS: Record<
  AchievementCode,
  { title: string; description: string; icon: Icon; tier: "bronze" | "silver" | "gold" }
> = {
  first_deploy: { title: "Estreia", description: "Seu primeiro deploy publicado.", icon: Rocket, tier: "bronze" },
  ten_deploys: { title: "Constante", description: "Dez deploys publicados.", icon: Trophy, tier: "silver" },
  first_star: { title: "Notado", description: "Alguém deu estrela num projeto seu.", icon: Star, tier: "bronze" },
  fast_deploy: { title: "Relâmpago", description: "Um deploy do push ao ar em menos de 60 segundos.", icon: Zap, tier: "silver" },
  rollback: { title: "Sangue frio", description: "Voltou uma versão com rollback.", icon: RotateCcw, tier: "bronze" },
  collaborator: { title: "Da equipe", description: "Membro em três projetos de outras pessoas.", icon: Users, tier: "silver" },
  uptime_30: { title: "Sempre no ar", description: "Um site seu trinta dias no ar sem cair.", icon: Clock, tier: "gold" },
};

export const XP_REASONS: Record<XpReason, string> = {
  DEPLOY: "Deploy publicado",
  FIRST_DEPLOY: "Bônus de estreia",
  PUBLISH: "Projeto na galeria",
  STAR_RECEIVED: "Estrela recebida",
  QUEST: "Missão concluída",
  ACHIEVEMENT: "Conquista",
  HELPFUL_COMMENT: "Comentário útil",
};

export const TIER_COLOR = {
  bronze: "var(--bronze)",
  silver: "var(--silver)",
  gold: "var(--gold)",
} as const;
