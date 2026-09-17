import { createClient } from './supabase/client';

export const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export class ApiError extends Error {
  status_code: number;
  constructor(status_code: number, message: string) {
    super(message);
    this.status_code = status_code;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...options.headers,
    },
  });

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
  published_at: string | null;
  last_deploy_at: string | null;
  created_at: string;
};

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
