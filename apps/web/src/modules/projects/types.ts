// Mirrors the backend's snake_case JSON (Prisma field names, unmapped — see
// the API's naming convention).
export type Project = {
  id: string;
  name: string;
  slug: string;
  repository_url: string;
  // Pasta do repositório onde roda o build ("" = a raiz). A saída é relativa a ela.
  root_dir: string;
  // Só o build; o npm install roda antes, sempre.
  build_command: string;
  output_dir: string;
  is_public: boolean;
  thumbnail_url: string | null;
  // Início da sequência atual "no ar" (ping do back). Ausente enquanto não existir.
  uptime_since?: string | null;
  // Papel de quem está logado neste projeto (só vem nas rotas de tenant).
  my_role?: ProjectRole;
  user_id: string;
  created_at: string;
  updated_at: string;
  deployments?: Deployment[];
  user?: { email: string };
};

// Resposta de POST /projects/check-root-dir. "unverified": não deu para saber
// (repositório privado sem acesso, GitHub fora do ar) e isso nunca bloqueia.
export type RootDirCheckStatus = "exists" | "missing" | "not_a_directory" | "unverified";

export type DeploymentStatus =
  | 'QUEUED'
  | 'PENDING'
  | 'CLONING'
  | 'BUILDING'
  | 'PUBLISHING'
  | 'SUCCESS'
  | 'FAILED';

export type Deployment = {
  id: string;
  project_id: string;
  status: DeploymentStatus;
  commit_sha: string | null;
  commit_message: string | null;
  release_path: string | null;
  log: string | null;
  created_at: string;
  finished_at: string | null;
};

export type ProjectRole = 'OWNER' | 'MEMBER';

export type ProjectMember = {
  user_id: string;
  handle: string;
  role: ProjectRole;
  since: string;
};

export type ProjectInvitation = {
  id: string;
  email: string;
  role: ProjectRole;
  created_at: string;
  expires_at: string;
};

export type MembersList = {
  my_role: ProjectRole;
  members: ProjectMember[];
  invitations: ProjectInvitation[];
};

export type InviteMemberResponse =
  | { status: 'added'; member: ProjectMember }
  | { status: 'invited'; invitation: ProjectInvitation };

export type EnvVar = {
  key: string;
  created_at: string;
  updated_at: string;
};

export type ActivityType =
  | 'DEPLOY_TRIGGERED'
  | 'DEPLOY_SUCCESS'
  | 'DEPLOY_FAILED'
  | 'MEMBER_ADDED'
  | 'MEMBER_REMOVED'
  | 'STAR_RECEIVED'
  | 'COMMENT_ADDED'
  | 'VISIBILITY_CHANGED';

export type ProjectActivity = {
  id: string;
  type: ActivityType;
  actor_id: string | null;
  actor_handle: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
};

export type ProjectAnalytics = {
  total: number;
  byDay: { date: string; views: number }[];
  byCountry: { country: string | null; views: number }[];
  byPath: { path: string; views: number }[];
};

// One message of GET /projects/:slug/status (server-sent events).
export type DeploymentStreamEvent =
  | { type: "status"; deploymentId: string; status: DeploymentStatus }
  | { type: "log"; deploymentId: string; chunk: string };
