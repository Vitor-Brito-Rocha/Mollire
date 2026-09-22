import { randomInt } from 'node:crypto';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProjectRole, Turma, TurmaGroupMode, TurmaRole } from '@prisma/client';
import { AuthenticatedUser } from '../auth/types';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreateTurmaDto } from './dto/create-turma.dto';

// Excludes 0/O/1/I/L — read aloud or copied off a projector, none of those
// pairs should be ambiguous.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

// Anonymous/non-member viewer: match nothing, so starred_by_viewer /
// is_member come back false. Same trick as GalleryService.viewerStars.
const viewerRow = (viewerId?: string): Prisma.StringFilter => (viewerId ? { equals: viewerId } : { in: [] });

// Turmas are a classroom on top of the existing Project/gallery model:
// membership (TurmaMember) is the boundary exactly like ProjectMember is for
// a project — every tenant-facing lookup goes through findForMember, so a
// turma you're not in doesn't exist for you (404, never 403). Stars reuse
// ProjectStar directly; grading is a few columns on Project itself.
@Injectable()
export class TurmasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
  ) {}

  async create(dto: CreateTurmaDto, user: AuthenticatedUser) {
    const name = dto.name.trim();
    const existing = await this.prisma.turma.findFirst({
      where: { owner_id: user.id, name: { equals: name, mode: 'insensitive' } },
    });
    if (existing) {
      throw new ConflictException(`you already have a turma named "${name}"`);
    }

    const groupMode = dto.group_mode ?? TurmaGroupMode.NONE;
    if (groupMode === TurmaGroupMode.GROUPS && dto.groups?.length) {
      const names = dto.groups.map((g) => g.name.trim().toLowerCase());
      if (new Set(names).size !== names.length) {
        throw new BadRequestException('group names must be unique within the turma');
      }
    }

    const code = await this.generateUniqueCode();
    const turma = await this.prisma.turma.create({
      data: {
        name,
        code,
        description: dto.description?.trim() || undefined,
        is_public: dto.is_public ?? false,
        capacity: dto.capacity,
        group_mode: groupMode,
        owner_id: user.id,
        members: { create: { user_id: user.id, role: TurmaRole.PROFESSOR } },
        groups:
          groupMode === TurmaGroupMode.GROUPS && dto.groups?.length
            ? { create: dto.groups.map((g) => ({ name: g.name.trim(), max_size: g.max_size })) }
            : undefined,
      },
      include: { groups: true },
    });

    return {
      id: turma.id,
      name: turma.name,
      code: turma.code,
      description: turma.description,
      is_public: turma.is_public,
      capacity: turma.capacity,
      group_mode: turma.group_mode,
      my_role: TurmaRole.PROFESSOR,
      groups: turma.groups.map((g) => this.toGroup(g, 0)),
      created_at: turma.created_at,
    };
  }

  async joinByCode(rawCode: string, user: AuthenticatedUser) {
    const turma = await this.prisma.turma.findUnique({ where: { code: rawCode.trim().toUpperCase() } });
    if (!turma) {
      throw new NotFoundException('invalid turma code');
    }
    return this.join(turma, user);
  }

  async joinPublic(turmaId: string, user: AuthenticatedUser) {
    const turma = await this.prisma.turma.findUnique({ where: { id: turmaId } });
    if (!turma || !turma.is_public) {
      throw new NotFoundException(`turma "${turmaId}" not found`);
    }
    return this.join(turma, user);
  }

  private async join(turma: Turma, user: AuthenticatedUser) {
    const existing = await this.prisma.turmaMember.findUnique({
      where: { turma_id_user_id: { turma_id: turma.id, user_id: user.id } },
    });
    if (existing) {
      return { turma_id: turma.id, role: existing.role, group_id: existing.group_id };
    }

    if (turma.capacity != null) {
      const count = await this.prisma.turmaMember.count({ where: { turma_id: turma.id, role: TurmaRole.ALUNO } });
      if (count >= turma.capacity) {
        throw new ConflictException('this turma is at capacity');
      }
    }

    const member = await this.prisma.turmaMember.create({
      data: { turma_id: turma.id, user_id: user.id, role: TurmaRole.ALUNO },
    });
    return { turma_id: turma.id, role: member.role, group_id: member.group_id };
  }

  async listMine(user: AuthenticatedUser) {
    const memberships = await this.prisma.turmaMember.findMany({
      where: { user_id: user.id },
      orderBy: { joined_at: 'desc' },
      include: { turma: { include: { _count: { select: { members: { where: { role: TurmaRole.ALUNO } } } } } } },
    });
    return memberships.map((m) => ({
      id: m.turma.id,
      name: m.turma.name,
      is_public: m.turma.is_public,
      my_role: m.role,
      students_count: m.turma._count.members,
      capacity: m.turma.capacity,
      created_at: m.turma.created_at,
    }));
  }

  async listPublic(viewerId?: string) {
    const turmas = await this.prisma.turma.findMany({
      where: { is_public: true },
      orderBy: { created_at: 'desc' },
      include: {
        owner: { select: { handle: true } },
        _count: { select: { members: { where: { role: TurmaRole.ALUNO } } } },
        members: { where: { user_id: viewerRow(viewerId) }, select: { user_id: true } },
      },
    });
    return turmas.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      owner: t.owner.handle ?? 'usuário',
      students_count: t._count.members,
      capacity: t.capacity,
      is_member: t.members.length > 0,
      created_at: t.created_at,
    }));
  }

  async detail(turmaId: string, user: AuthenticatedUser) {
    const turma = await this.findForMember(turmaId, user.id);
    const [membership, groups, studentsCount] = await Promise.all([
      this.prisma.turmaMember.findUnique({ where: { turma_id_user_id: { turma_id: turma.id, user_id: user.id } } }),
      this.prisma.turmaGroup.findMany({
        where: { turma_id: turma.id },
        orderBy: { name: 'asc' },
        include: { _count: { select: { members: true } } },
      }),
      this.prisma.turmaMember.count({ where: { turma_id: turma.id, role: TurmaRole.ALUNO } }),
    ]);

    return {
      id: turma.id,
      name: turma.name,
      description: turma.description,
      // Only worth showing to someone who's already in — but everyone here is
      // a member, and the professor needs it to hand out to the rest.
      code: turma.code,
      is_public: turma.is_public,
      capacity: turma.capacity,
      group_mode: turma.group_mode,
      my_role: membership?.role ?? TurmaRole.ALUNO,
      my_group_id: membership?.group_id ?? null,
      students_count: studentsCount,
      groups: groups.map((g) => this.toGroup(g, g._count.members)),
      created_at: turma.created_at,
    };
  }

  async students(turmaId: string, professor: AuthenticatedUser) {
    const turma = await this.findForMember(turmaId, professor.id, TurmaRole.PROFESSOR);
    const members = await this.prisma.turmaMember.findMany({
      where: { turma_id: turma.id },
      orderBy: [{ role: 'asc' }, { joined_at: 'asc' }],
      include: { user: { select: { handle: true } }, group: { select: { id: true, name: true } } },
    });
    return members.map((m) => ({
      user_id: m.user_id,
      handle: m.user.handle ?? 'usuário',
      role: m.role,
      group: m.group ? { id: m.group.id, name: m.group.name } : null,
      joined_at: m.joined_at,
    }));
  }

  async addGroup(turmaId: string, professor: AuthenticatedUser, dto: CreateGroupDto) {
    const turma = await this.findForMember(turmaId, professor.id, TurmaRole.PROFESSOR);
    let group;
    try {
      group = await this.prisma.turmaGroup.create({
        data: { turma_id: turma.id, name: dto.name.trim(), max_size: dto.max_size },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException(`group "${dto.name}" already exists in this turma`);
      }
      throw err;
    }
    // A group only makes sense once the turma is in GROUPS mode.
    if (turma.group_mode === TurmaGroupMode.NONE) {
      await this.prisma.turma.update({ where: { id: turma.id }, data: { group_mode: TurmaGroupMode.GROUPS } });
    }
    return this.toGroup(group, 0);
  }

  async removeGroup(turmaId: string, professor: AuthenticatedUser, groupId: string) {
    const turma = await this.findForMember(turmaId, professor.id, TurmaRole.PROFESSOR);
    const group = await this.prisma.turmaGroup.findFirst({ where: { id: groupId, turma_id: turma.id } });
    if (!group) {
      throw new NotFoundException(`group "${groupId}" not found`);
    }
    // Members and any submitted projects fall back to "no group" (onDelete: SetNull).
    await this.prisma.turmaGroup.delete({ where: { id: group.id } });
  }

  async joinGroup(turmaId: string, groupId: string, user: AuthenticatedUser) {
    const turma = await this.findForMember(turmaId, user.id);
    const group = await this.prisma.turmaGroup.findFirst({ where: { id: groupId, turma_id: turma.id } });
    if (!group) {
      throw new NotFoundException(`group "${groupId}" not found`);
    }
    const size = await this.prisma.turmaMember.count({ where: { group_id: group.id } });
    if (size >= group.max_size) {
      throw new ConflictException(`group "${group.name}" is full`);
    }
    await this.prisma.turmaMember.update({
      where: { turma_id_user_id: { turma_id: turma.id, user_id: user.id } },
      data: { group_id: group.id },
    });
    return this.toGroup(group, size + 1);
  }

  async leaveGroup(turmaId: string, user: AuthenticatedUser) {
    const turma = await this.findForMember(turmaId, user.id);
    await this.prisma.turmaMember.update({
      where: { turma_id_user_id: { turma_id: turma.id, user_id: user.id } },
      data: { group_id: null },
    });
  }

  // The turma's own gallery: every project submitted to it, star counts
  // included. Visible to anyone if the turma is public, members-only
  // otherwise — independent of each project's own is_public flag.
  async gallery(turmaId: string, viewer?: AuthenticatedUser) {
    const turma = await this.assertGalleryAccess(turmaId, viewer?.id);
    const projects = await this.prisma.project.findMany({
      where: { turma_id: turma.id },
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { handle: true } },
        turmaGroup: { select: { id: true, name: true } },
        _count: { select: { stars: true } },
        stars: { where: { user_id: viewerRow(viewer?.id) }, select: { user_id: true } },
      },
    });
    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      author: p.user.handle ?? 'usuário',
      thumbnail_url: p.thumbnail_url,
      stars: p._count.stars,
      starred_by_viewer: p.stars.length > 0,
      group: p.turmaGroup ? { id: p.turmaGroup.id, name: p.turmaGroup.name } : null,
      grade: p.grade,
      graded_at: p.graded_at,
      created_at: p.created_at,
    }));
  }

  async submitProject(turmaId: string, user: AuthenticatedUser, slug: string) {
    const turma = await this.findForMember(turmaId, user.id);
    const project = await this.projects.findForMember(slug, user.id, ProjectRole.OWNER);
    const membership = await this.prisma.turmaMember.findUnique({
      where: { turma_id_user_id: { turma_id: turma.id, user_id: user.id } },
    });

    const updated = await this.prisma.project.update({
      where: { id: project.id },
      data: {
        turma_id: turma.id,
        turma_group_id: membership?.group_id ?? null,
        // Resubmitting clears any previous grade — it's grading new work.
        grade: null,
        graded_at: null,
        graded_by: null,
      },
    });
    return { slug: updated.slug, turma_id: updated.turma_id, turma_group_id: updated.turma_group_id };
  }

  async removeSubmission(turmaId: string, user: AuthenticatedUser, slug: string) {
    const project = await this.projects.findForMember(slug, user.id, ProjectRole.OWNER);
    if (project.turma_id !== turmaId) {
      throw new NotFoundException(`project "${slug}" not found in this turma`);
    }
    await this.prisma.project.update({
      where: { id: project.id },
      data: { turma_id: null, turma_group_id: null, grade: null, graded_at: null, graded_by: null },
    });
  }

  async gradeProject(turmaId: string, professor: AuthenticatedUser, slug: string, grade: number) {
    await this.findForMember(turmaId, professor.id, TurmaRole.PROFESSOR);
    const project = await this.prisma.project.findFirst({ where: { slug, turma_id: turmaId } });
    if (!project) {
      throw new NotFoundException(`project "${slug}" not found in this turma`);
    }
    const updated = await this.prisma.project.update({
      where: { id: project.id },
      data: { grade, graded_at: new Date(), graded_by: professor.id },
    });
    return { slug: updated.slug, grade: updated.grade, graded_at: updated.graded_at };
  }

  async star(turmaId: string, slug: string, userId: string) {
    const project = await this.findTurmaProject(turmaId, slug, userId);
    if (project.user_id === userId) {
      throw new ConflictException("can't star your own project");
    }
    try {
      await this.prisma.projectStar.create({ data: { project_id: project.id, user_id: userId } });
    } catch (err) {
      if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')) {
        throw err;
      }
      // Already starred — idempotent no-op.
    }
    return this.starState(project.id, userId);
  }

  async unstar(turmaId: string, slug: string, userId: string) {
    const project = await this.findTurmaProject(turmaId, slug, userId);
    await this.prisma.projectStar.deleteMany({ where: { project_id: project.id, user_id: userId } });
    return this.starState(project.id, userId);
  }

  // Membership is the tenant boundary for a turma — same rule as
  // ProjectsService.findForMember: not-a-member and doesn't-exist must look
  // identical from the outside.
  async findForMember(turmaId: string, userId: string, minRole: TurmaRole = TurmaRole.ALUNO) {
    const turma = await this.prisma.turma.findFirst({
      where: {
        id: turmaId,
        members: { some: { user_id: userId, ...(minRole === TurmaRole.PROFESSOR ? { role: TurmaRole.PROFESSOR } : {}) } },
      },
    });
    if (!turma) {
      throw new NotFoundException(`turma "${turmaId}" not found`);
    }
    return turma;
  }

  private async assertGalleryAccess(turmaId: string, viewerId?: string) {
    const turma = await this.prisma.turma.findUnique({ where: { id: turmaId } });
    if (!turma) {
      throw new NotFoundException(`turma "${turmaId}" not found`);
    }
    if (turma.is_public) {
      return turma;
    }
    if (!viewerId) {
      throw new NotFoundException(`turma "${turmaId}" not found`);
    }
    const member = await this.prisma.turmaMember.findUnique({
      where: { turma_id_user_id: { turma_id: turmaId, user_id: viewerId } },
    });
    if (!member) {
      throw new NotFoundException(`turma "${turmaId}" not found`);
    }
    return turma;
  }

  private async findTurmaProject(turmaId: string, slug: string, viewerId?: string) {
    await this.assertGalleryAccess(turmaId, viewerId);
    const project = await this.prisma.project.findFirst({ where: { slug, turma_id: turmaId } });
    if (!project) {
      throw new NotFoundException(`project "${slug}" not found in this turma`);
    }
    return project;
  }

  private async starState(projectId: string, userId: string) {
    const [stars, mine] = await Promise.all([
      this.prisma.projectStar.count({ where: { project_id: projectId } }),
      this.prisma.projectStar.findUnique({
        where: { project_id_user_id: { project_id: projectId, user_id: userId } },
      }),
    ]);
    return { stars, starred_by_viewer: !!mine };
  }

  private toGroup(group: { id: string; name: string; max_size: number }, membersCount: number) {
    return { id: group.id, name: group.name, max_size: group.max_size, members_count: membersCount };
  }

  private async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      let code = '';
      for (let i = 0; i < CODE_LENGTH; i++) {
        code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
      }
      const exists = await this.prisma.turma.findUnique({ where: { code } });
      if (!exists) return code;
    }
    throw new Error('could not generate a unique turma code');
  }
}
