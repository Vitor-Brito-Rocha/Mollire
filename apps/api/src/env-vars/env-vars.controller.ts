import { Body, Controller, Delete, Get, HttpCode, Param, Put } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/types';
import { CurrentUser } from '../auth/current-user.decorator';
import { UpsertEnvVarDto } from './dto/upsert-env-var.dto';
import { EnvVarsService } from './env-vars.service';

@Controller('projects/:slug/env')
export class EnvVarsController {
  constructor(private readonly envVarsService: EnvVarsService) {}

  @Get()
  list(@Param('slug') slug: string, @CurrentUser() user: AuthenticatedUser) {
    return this.envVarsService.list(slug, user.id);
  }

  @Put(':key')
  @HttpCode(204)
  async upsert(
    @Param('slug') slug: string,
    @Param('key') key: string,
    @Body() dto: UpsertEnvVarDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.envVarsService.upsert(slug, user.id, key, dto.value);
  }

  @Delete(':key')
  @HttpCode(204)
  async remove(
    @Param('slug') slug: string,
    @Param('key') key: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.envVarsService.remove(slug, user.id, key);
  }
}
