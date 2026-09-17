import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeploymentStatus, Prisma, Role } from '@prisma/client';
import { AuthenticatedUser } from '../auth/types';
import { PrismaService } from '../prisma/prisma.service';

// Paid to the project owner, not the person starring — rewards making
// something others appreciate, not the act of clicking.
const STAR_XP = 5;

type Viewer = AuthenticatedUser | undefined;

// Anonymous viewer: match no stars, so starred_by_viewer comes back false.
const viewerStars = (viewerId?: string): Prisma.ProjectStarWhereInput =>
  viewerId ? { user_id: viewerId } : { user_id: { in: [] } };

type CommentRow = Prisma.CommentGetPayload<{
  include: { user: { select: { id: true; handle: true } } };
}>;

@Injectable()
export class GalleryService {
  private readonly domain: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.domain = config.getOrThrow<string>('DOMAIN');
  }

  async list(filter: 'recentes' | 'destaque' | 'todos' | undefined, viewerId?: string) {
    const projects = await this.prisma.project.findMany({
      where: { is_public: true },
      orderBy: filter === 'destaque' ? { stars: { _count: 'desc' } } : { created_at: 'desc' },
      include: {
        // Only the public handle ever leaves the API — never the owner's email.
        user: { select: { handle: true } },
        _count: { select: { stars: true } },
        stars: { where: viewerStars(viewerId), select: { user_id: true } },
      },
    });

    return projects.map((project) => ({
      id: project.id,
      name: project.name,
      slug: project.slug,
      author: project.user.handle ?? 'usuário',
      thumbnail_url: project.thumbnail_url,
      stars: project._count.stars,
      starred_by_viewer: project.stars.length > 0,
      created_at: project.created_at,
    }));
  }

  // The public project page. Same rule as list(): a private project doesn't
  // exist to anyone but its owner (404, never 403).
  async detail(slug: string, viewerId?: string) {
    const project = await this.prisma.project.findFirst({
      where: { slug, is_public: true },
      include: {
        user: { select: { id: true, handle: true } },
        _count: { select: { stars: true, comments: { where: { deleted_at: null } } } },
        stars: { where: viewerStars(viewerId), select: { user_id: true } },
        deployments: {
          where: { status: DeploymentStatus.SUCCESS },
          orderBy: { created_at: 'desc' },
          take: 1,
          select: { created_at: true, finished_at: true },
        },
        // Handles only — who works on it, never who they are.
        members: {
          orderBy: [{ role: 'asc' }, { created_at: 'asc' }],
          select: { role: true, user: { select: { handle: true } } },
        },
      },
    });
    if (!project) {
      throw new NotFoundException(`project "${slug}" not found`);
    }

    const lastDeploy = project.deployments[0];
    return {
      id: project.id,
      name: project.name,
      slug: project.slug,
      url: `https://${project.slug}.${this.domain}`,
      author: project.user.handle ?? 'usuário',
      thumbnail_url: project.thumbnail_url,
      stars: project._count.stars,
      starred_by_viewer: project.stars.length > 0,
      // The owner can't star their own project; the UI hides the button.
      is_owner: viewerId === project.user_id,
      comments: project._count.comments,
      members: project.members.map((m) => ({ handle: m.user.handle ?? 'usuário', role: m.role })),
      published_at: project.published_at,
      last_deploy_at: lastDeploy?.finished_at ?? lastDeploy?.created_at ?? null,
      created_at: project.created_at,
    };
  }

  async star(slug: string, userId: string) {
    const project = await this.findPublicBySlug(slug);
    if (project.user_id === userId) {
      throw new ConflictException("can't star your own project");
    }

    try {
      await this.prisma.projectStar.create({
        data: { project_id: project.id, user_id: userId },
      });
      await this.prisma.user.update({
        where: { id: project.user_id },
        data: { xp: { increment: STAR_XP } },
      });
    } catch (err) {
      // Already starred — idempotent no-op, not an error.
      if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')) {
        throw err;
      }
    }

    return this.starState(project.id, userId);
  }

  async unstar(slug: string, userId: string) {
    const project = await this.findPublicBySlug(slug);
    // deleteMany, not delete: unstarring something never starred is a no-op,
    // not a 404 — the viewer's intent (not starred) is already satisfied.
    await this.prisma.projectStar.deleteMany({
      where: { project_id: project.id, user_id: userId },
    });
    return this.starState(project.id, userId);
  }

  async listComments(slug: string, viewer: Viewer) {
    const project = await this.findPublicBySlug(slug);
    const comments = await this.prisma.comment.findMany({
      where: { project_id: project.id, deleted_at: null },
      orderBy: { created_at: 'asc' },
      include: { user: { select: { id: true, handle: true } } },
    });
    return comments.map((comment) => this.toComment(comment, project.user_id, viewer));
  }

  async addComment(slug: string, user: AuthenticatedUser, body: string) {
    const project = await this.findPublicBySlug(slug);
    const comment = await this.prisma.comment.create({
      data: { project_id: project.id, user_id: user.id, body: body.trim() },
      include: { user: { select: { id: true, handle: true } } },
    });
    return this.toComment(comment, project.user_id, user);
  }

  // Soft delete, by the comment's author or an admin. Anyone else gets 404:
  // "not yours" and "doesn't exist" look the same, as everywhere else here.
  async deleteComment(slug: string, commentId: string, user: AuthenticatedUser) {
    const project = await this.findPublicBySlug(slug);
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, project_id: project.id, deleted_at: null },
    });
    if (!comment || (comment.user_id !== user.id && user.role !== Role.ADMIN)) {
      throw new NotFoundException(`comment "${commentId}" not found`);
    }
    await this.prisma.comment.update({
      where: { id: commentId },
      data: { deleted_at: new Date() },
    });
  }

  private toComment(comment: CommentRow, ownerId: string, viewer: Viewer) {
    return {
      id: comment.id,
      body: comment.body,
      author: comment.user.handle ?? 'usuário',
      is_project_owner: comment.user.id === ownerId,
      can_delete: !!viewer && (viewer.id === comment.user.id || viewer.role === Role.ADMIN),
      created_at: comment.created_at,
    };
  }

  private async findPublicBySlug(slug: string) {
    const project = await this.prisma.project.findFirst({ where: { slug, is_public: true } });
    if (!project) {
      throw new NotFoundException(`project "${slug}" not found`);
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
}
