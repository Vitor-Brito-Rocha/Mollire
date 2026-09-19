export const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export class ApiError extends Error {
  status_code: number;
  constructor(status_code: number, message: string) {
    super(message);
    this.status_code = status_code;
  }
}

function send(path: string, options: RequestInit): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...options,
    // The session is an httpOnly cookie the browser attaches on its own; JS
    // never sees the token.
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      // ngrok's free tier answers browser requests with an HTML warning page
      // unless this header is present (harmless when the API isn't behind ngrok).
      'ngrok-skip-browser-warning': '1',
      ...options.headers,
    },
  });
}

// The access cookie is short-lived (1h). On a 401 the API can swap the refresh
// cookie for a new pair; calls that fail together share one refresh, since the
// refresh token rotates.
let refreshing: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  refreshing ??= send('/auth/refresh', { method: 'POST' })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

// These 401s mean "wrong credentials" / "no session", not "expired": no retry.
const NO_REFRESH = ['/auth/login', '/auth/signup', '/auth/refresh', '/auth/logout', '/auth/forgot', '/auth/confirm'];

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response = await send(path, options);

  if (response.status === 401 && !NO_REFRESH.includes(path) && (await refreshSession())) {
    response = await send(path, options);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(response.status, body.message ?? 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }),
};

// Mirrors the backend's snake_case JSON (Prisma field names, unmapped — see
// the API's naming convention).
export type Project = {
  id: string;
  name: string;
  slug: string;
  repository_url: string;
  build_command: string;
  output_dir: string;
  is_public: boolean;
  thumbnail_url: string | null;
  // Papel de quem está logado neste projeto (só vem nas rotas de tenant).
  my_role?: ProjectRole;
  user_id: string;
  created_at: string;
  updated_at: string;
  deployments?: Deployment[];
  user?: { email: string };
};

export type DeploymentStatus =
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
  release_path: string | null;
  log: string | null;
  created_at: string;
  finished_at: string | null;
};

export type CurrentUser = {
  id: string;
  email: string;
  // Identidade pública (galeria, comentários). Nunca mostrar o e-mail no lugar dela.
  handle: string | null;
  role: 'ADMIN' | 'TENANT';
  xp: number;
  level: number;
  next: number;
  // Convites de projeto resgatados nesta chamada (0 na maioria das vezes).
  joined_projects?: number;
  github_connected: boolean;
};

export type GithubRepo = {
  id: number;
  full_name: string;
  name: string;
  private: boolean;
  html_url: string;
  clone_url: string;
  default_branch: string;
};

export type GalleryFilter = 'recentes' | 'destaque' | 'todos';

export type GalleryProject = {
  id: string;
  name: string;
  slug: string;
  author: string;
  thumbnail_url: string | null;
  stars: number;
  starred_by_viewer: boolean;
  created_at: string;
};

export type GalleryProjectDetail = {
  id: string;
  name: string;
  slug: string;
  url: string;
  author: string;
  thumbnail_url: string | null;
  stars: number;
  starred_by_viewer: boolean;
  is_owner: boolean;
  comments: number;
  members: { handle: string; role: ProjectRole }[];
  published_at: string | null;
  last_deploy_at: string | null;
  created_at: string;
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

export type GalleryComment = {
  id: string;
  body: string;
  author: string;
  is_project_owner: boolean;
  can_delete: boolean;
  created_at: string;
};

export type StarState = {
  stars: number;
  starred_by_viewer: boolean;
};

export type AdminUser = {
  id: string;
  email: string;
  role: 'ADMIN' | 'TENANT';
  created_at: string;
  updated_at: string;
};

// A pending grant of ADMIN, parked for an email that hasn't logged in yet —
// redeemed automatically on that email's first login.
export type AdminInvite = {
  email: string;
  invited_by: string;
  created_at: string;
};

export type AdminsList = {
  admins: AdminUser[];
  pendingInvites: AdminInvite[];
};

export type InviteAdminResponse =
  | { status: 'promoted'; user: AdminUser }
  | { status: 'already_admin'; user: AdminUser }
  | { status: 'invited'; invite: AdminInvite };
