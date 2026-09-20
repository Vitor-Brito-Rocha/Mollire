import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ProjectRole } from '@prisma/client';
import { EnvCryptoService } from '../common/env-crypto.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';

@Injectable()
export class EnvVarsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
    private readonly crypto: EnvCryptoService,
  ) {}

  async list(slug: string, userId: string) {
    const project = await this.projects.findForMember(slug, userId, ProjectRole.OWNER);
    const vars = await this.prisma.projectEnvVar.findMany({
      where: { project_id: project.id },
      select: { key: true, created_at: true, updated_at: true },
      orderBy: { key: 'asc' },
    });
    return vars;
  }

  private validateKey(key: string) {
    if (!/^[A-Z_][A-Z0-9_]*$/.test(key) || key.length > 256) {
      throw new BadRequestException('key must be uppercase letters, digits and underscores (max 256 chars)');
    }
  }

  async upsert(slug: string, userId: string, key: string, value: string) {
    this.validateKey(key);
    const project = await this.projects.findForMember(slug, userId, ProjectRole.OWNER);
    const encrypted = this.crypto.encrypt(value);
    await this.prisma.projectEnvVar.upsert({
      where: { project_id_key: { project_id: project.id, key } },
      create: { project_id: project.id, key, value: encrypted },
      update: { value: encrypted },
    });
  }

  async remove(slug: string, userId: string, key: string) {
    this.validateKey(key);
    const project = await this.projects.findForMember(slug, userId, ProjectRole.OWNER);
    const deleted = await this.prisma.projectEnvVar.deleteMany({
      where: { project_id: project.id, key },
    });
    if (deleted.count === 0) throw new NotFoundException(`env var "${key}" not found`);
  }

  async getDecrypted(projectId: string): Promise<Record<string, string>> {
    const vars = await this.prisma.projectEnvVar.findMany({
      where: { project_id: projectId },
      select: { key: true, value: true },
    });
    return Object.fromEntries(vars.map((v) => [v.key, this.crypto.decrypt(v.value)]));
  }
}
