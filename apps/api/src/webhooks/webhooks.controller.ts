import {
  BadRequestException,
  Controller,
  Headers,
  Logger,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import * as crypto from 'node:crypto';
import { Public } from '../auth/public.decorator';
import { DeploymentsService } from '../deployments/deployments.service';
import { PrismaService } from '../prisma/prisma.service';

type PushPayload = {
  ref: string;
  after: string;
  installation?: { id: number };
  repository: {
    full_name: string;
    clone_url: string;
    default_branch: string;
  };
  head_commit?: { message: string };
};

type InstallationPayload = {
  action: string;
  installation: { id: number };
};

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);
  private readonly secret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly deployments: DeploymentsService,
    config: ConfigService,
  ) {
    this.secret = config.getOrThrow('GITHUB_WEBHOOK_SECRET');
  }

  @Public()
  @Post('github')
  async handleGithub(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature: string | undefined,
    @Headers('x-github-event') event: string | undefined,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) throw new BadRequestException('missing raw body');
    if (!signature) throw new UnauthorizedException('missing signature');

    this.verifySignature(rawBody, signature);

    const body = rawBody.toString('utf-8');

    if (event === 'installation') {
      const payload = JSON.parse(body) as InstallationPayload;
      if (payload.action === 'deleted') {
        await this.prisma.githubAccount.deleteMany({
          where: { installation_id: BigInt(payload.installation.id) },
        });
        this.logger.log(`GitHub App uninstalled (installation ${payload.installation.id}) — removed GithubAccount`);
      }
      return { ignored: false };
    }

    if (event !== 'push') return { ignored: true };

    const payload = JSON.parse(body) as PushPayload;

    // Only deploy on pushes to the default branch.
    const branch = payload.ref.replace('refs/heads/', '');
    if (branch !== payload.repository.default_branch) return { ignored: true };

    const fullName = payload.repository.full_name;
    const project = await this.findProjectByRepo(fullName);
    if (!project) {
      this.logger.debug(`no project found for repo ${fullName}`);
      return { ignored: true };
    }

    this.logger.log(`push on ${fullName} → triggering deploy for project ${project.slug}`);
    await this.deployments.trigger(project, {
      installationId: payload.installation?.id ? BigInt(payload.installation.id) : undefined,
      commitSha: payload.after,
      commitMessage: payload.head_commit?.message,
    });
    return { triggered: true, project: project.slug };
  }

  private verifySignature(payload: Buffer, signature: string) {
    const expected = `sha256=${crypto.createHmac('sha256', this.secret).update(payload).digest('hex')}`;
    if (expected.length !== signature.length) throw new UnauthorizedException('invalid signature');
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
      throw new UnauthorizedException('invalid signature');
    }
  }

  // Matches the webhook's full_name (e.g. "user/repo") against stored
  // repository_url values — handles both https://github.com/user/repo and
  // https://github.com/user/repo.git formats.
  private async findProjectByRepo(fullName: string) {
    const candidates = [
      `https://github.com/${fullName}`,
      `https://github.com/${fullName}.git`,
    ];
    return this.prisma.project.findFirst({
      where: { repository_url: { in: candidates } },
    });
  }
}
