import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { SupabaseAuthService } from './supabase-auth.service';
import { SupabaseGoTrueService } from './supabase-gotrue.service';

@Module({
  controllers: [AuthController],
  providers: [SupabaseAuthService, SupabaseGoTrueService, JwtAuthGuard, RolesGuard],
  exports: [SupabaseAuthService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
