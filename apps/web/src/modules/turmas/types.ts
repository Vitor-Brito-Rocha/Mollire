import type { GalleryProject } from "@/modules/gallery";

// Espelho dos contratos em docs/api-turmas.md e docs/api-grupos.md (snake_case
// da API). Campos marcados como opcionais só chegam quando o back da ideia
// correspondente existir: o front mostra o bloco quando o campo vem.
export type TurmaRole = "PROFESSOR" | "ALUNO";
export type TurmaGroupMode = "NONE" | "GROUPS";

export type TurmaGroup = {
  id: string;
  name: string;
  max_size: number;
  members_count: number;
  // Código de convite do grupo (api-grupos §6). Ausente até o back gerar.
  code?: string;
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

// Quem trabalha num projeto da turma: dono primeiro (api-grupos §1).
export type TeamMember = { handle: string; level: number; frame?: string | null };

// GET /turmas/:id/gallery — a galeria normal, mais grupo, equipe, nota e feedback.
export type TurmaProject = GalleryProject & {
  group: { id: string; name: string } | null;
  grade: number | null;
  graded_at: string | null;
  team?: TeamMember[];
  // Feedback do professor (§5): só vem para quem pode ler; `null` = sem texto.
  grade_comment?: string | null;
  // Só para o professor e a equipe: se o texto está aberto à turma.
  grade_comment_public?: boolean;
};

export type NewTurma = {
  name: string;
  description?: string;
  is_public?: boolean;
  capacity?: number;
  group_mode?: TurmaGroupMode;
  groups?: { name: string; max_size: number }[];
};

// POST /turmas/join — `group_full`: entrou na turma, mas o grupo do código estava cheio.
export type JoinResult = { turma_id: string; role: TurmaRole; group_id: string | null; group_full?: boolean };

// POST /turmas/:id/projects/:slug/grade
export type GradeInput = { grade: number; comment?: string | null; comment_public?: boolean };

// ---- Entregas (api-grupos §2) ------------------------------------------------

export type MilestoneRequirements = { deployed: boolean; published: boolean; min_stars: number | null };

// done: no prazo · late: depois do prazo · pending: falta, há prazo · missed: falta, prazo passou.
export type MilestoneStatus = "pending" | "done" | "late" | "missed";

export type MilestoneUnit = { type: "group" | "student"; id: string; name: string };

export type TurmaMilestone = {
  id: string;
  title: string;
  description: string | null;
  due_at: string;
  requirements: MilestoneRequirements;
  created_at: string;
  // A unidade de quem vê (aluno). `null` para o professor, ou aluno sem grupo.
  mine: { status: MilestoneStatus; completed_at: string | null; project: { slug: string; name: string } | null } | null;
  // Para o professor: quantas unidades cumpriram.
  stats: { completed: number; total: number } | null;
};

export type MilestoneRow = {
  unit: MilestoneUnit;
  project: { slug: string; name: string } | null;
  status: MilestoneStatus;
  completed_at: string | null;
};

// GET /turmas/:id/milestones/:milestoneId (professor)
export type MilestoneDetail = TurmaMilestone & { rows: MilestoneRow[] };

export type NewMilestone = {
  title: string;
  description?: string | null;
  due_at: string;
  requirements: MilestoneRequirements;
};

// GET /turmas/:id/progress (api-grupos §4): a turma contra a própria meta.
export type TurmaProgress = {
  students: number;
  with_deploy: number;
  published: number;
  milestones: { id: string; title: string; completed: number; total: number }[];
  xp_week: number;
};
