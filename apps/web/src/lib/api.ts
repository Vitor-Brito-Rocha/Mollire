import { createClient } from './supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

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
  role: 'ADMIN' | 'TENANT';
};
