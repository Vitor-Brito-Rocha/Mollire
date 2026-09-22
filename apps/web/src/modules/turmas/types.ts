import type { GalleryProject } from "@/modules/gallery";

// Espelho do contrato em docs/api-turmas.md (snake_case da API).
export type TurmaRole = "PROFESSOR" | "ALUNO";
export type TurmaGroupMode = "NONE" | "GROUPS";

export type TurmaGroup = {
  id: string;
  name: string;
  max_size: number;
  members_count: number;
};

// GET /turmas/mine
export type TurmaSummary = {
  id: string;
  name: string;
  is_public: boolean;
  my_role: TurmaRole;
  students_count: number;
  capacity: number | null;
  created_at: string;
};

// GET /turmas/public
export type PublicTurma = {
  id: string;
  name: string;
  description: string | null;
  owner: string;
  students_count: number;
  capacity: number | null;
  is_member: boolean;
  created_at: string;
};

// GET /turmas/:id
export type TurmaDetail = {
  id: string;
  name: string;
  description: string | null;
  code: string;
  is_public: boolean;
  capacity: number | null;
  group_mode: TurmaGroupMode;
  my_role: TurmaRole;
  my_group_id: string | null;
  students_count: number;
  groups: TurmaGroup[];
  created_at: string;
};

// GET /turmas/:id/students (professor)
export type TurmaStudent = {
  user_id: string;
  handle: string;
  role: TurmaRole;
  group: { id: string; name: string } | null;
  joined_at: string;
};

// GET /turmas/:id/gallery — a galeria normal, mais grupo e nota.
export type TurmaProject = GalleryProject & {
  group: { id: string; name: string } | null;
  grade: number | null;
  graded_at: string | null;
};

export type NewTurma = {
  name: string;
  description?: string;
  is_public?: boolean;
  capacity?: number;
  group_mode?: TurmaGroupMode;
  groups?: { name: string; max_size: number }[];
};

export type JoinResult = { turma_id: string; role: TurmaRole; group_id: string | null };
