import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeploymentStatus, Prisma, Role, XpReason } from '@prisma/client';
import { ActivityService } from '../activity/activity.service';
import { AuthenticatedUser } from '../auth/types';
import { AchievementsService } from '../progress/achievements.service';
import { PrismaService } from '../prisma/prisma.service';
import { UptimeService } from '../uptime/uptime.service';
import { XpService } from '../xp/xp.service';

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
    private readonly activity: ActivityService,
    private readonly xp: XpService,
    private readonly uptime: UptimeService,
    private readonly achievements: AchievementsService,
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
    const uptimeSince = await this.uptime.since(project.id);
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
      uptime_since: uptimeSince,
      created_at: project.created_at,
    };
  }

  async star(slug: string, userId: string) {
    const project = await this.findPublicBySlug(slug);
    if (project.user_id === userId) {
      throw new ConflictException("can't star your own project");
    }

    try {
      await this.prisma.projectStar.create({ data: { project_id: project.id, user_id: userId } });
    } catch (err) {
      // Already starred — idempotent no-op, not an error, and pays nothing.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return this.starState(project.id, userId);
      }
      throw err;
    }

    // Paid to the project owner, not the person starring — rewards making
    // something others appreciate, not the act of clicking.
    await this.xp.award(project.user_id, XpReason.STAR_RECEIVED, { projectId: project.id, actorId: userId });
    void this.achievements.checkAfterEvent(project.user_id);
    const starrer = await this.prisma.user.findUnique({ where: { id: userId }, select: { handle: true } });
    this.activity.record({ project_id: project.id, type: 'STAR_RECEIVED', actor_id: userId, payload: { from_handle: starrer?.handle ?? 'usuário' } });

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
    this.activity.record({ project_id: project.id, type: 'COMMENT_ADDED', actor_id: user.id, payload: { handle: user.handle ?? 'usuário', body_preview: body.trim().slice(0, 80) } });
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

  // Owner-only: "this comment helped". Pays the comment's author, once per
  // comment (helpful_paid_at survives un-flagging). The owner can't flag their
  // own comment — that would be paying themselves.
  async markHelpful(slug: string, commentId: string, user: AuthenticatedUser) {
    const { comment } = await this.findCommentForOwner(slug, commentId, user);
    if (comment.user_id === user.id) {
      throw new ConflictException("can't mark your own comment as helpful");
    }

    await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      // Atomic "first time only": exactly one concurrent request can flip
      // helpful_paid_at from null, and only that one pays.
      const first = await tx.comment.updateMany({
        where: { id: comment.id, helpful_paid_at: null },
        data: { helpful_at: now, helpful_paid_at: now },
      });
      if (first.count === 1) {
        await this.xp.award(
          comment.user_id,
          XpReason.HELPFUL_COMMENT,
          { projectId: comment.project_id, actorId: user.id },
          tx,
        );
      } else {
        await tx.comment.updateMany({ where: { id: comment.id, helpful_at: null }, data: { helpful_at: now } });
      }
    });
  }

  async unmarkHelpful(slug: string, commentId: string, user: AuthenticatedUser) {
    const { comment } = await this.findCommentForOwner(slug, commentId, user);
    // No refund: the XP was for the moment it helped.
    await this.prisma.comment.update({ where: { id: comment.id }, data: { helpful_at: null } });
  }

  private async findCommentForOwner(slug: string, commentId: string, user: AuthenticatedUser) {
    const project = await this.findPublicBySlug(slug);
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, project_id: project.id, deleted_at: null },
    });
    if (!comment) {
      throw new NotFoundException(`comment "${commentId}" not found`);
    }
    if (project.user_id !== user.id) {
      throw new ForbiddenException('only the project owner can mark comments as helpful');
    }
    return { project, comment };
  }

  private toComment(comment: CommentRow, ownerId: string, viewer: Viewer) {
    return {
      id: comment.id,
      body: comment.body,
      author: comment.user.handle ?? 'usuário',
      is_project_owner: comment.user.id === ownerId,
      helpful: comment.helpful_at !== null,
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
