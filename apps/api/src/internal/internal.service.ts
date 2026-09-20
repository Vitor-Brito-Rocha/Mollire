import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types';

@Injectable()
export class InternalService {
  constructor(private readonly prisma: PrismaService) {}

  async checkAccess(slug: string, user?: AuthenticatedUser): Promise<'ok' | 'unauthorized' | 'forbidden' | 'not_found'> {
    const project = await this.prisma.project.findUnique({
      where: { slug },
      select: { id: true, is_public: true },
    });

    if (!project) return 'not_found';
    if (project.is_public) return 'ok';
    if (!user) return 'unauthorized';

    const membership = await this.prisma.projectMember.findUnique({
      where: { project_id_user_id: { project_id: project.id, user_id: user.id } },
      select: { id: true },
    });

    return membership ? 'ok' : 'forbidden';
  }
}
