import type { ProjectRole } from "@/modules/projects";

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
