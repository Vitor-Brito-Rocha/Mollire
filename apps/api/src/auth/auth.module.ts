import { Module } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { SupabaseAuthService } from './supabase-auth.service';

@Module({
  providers: [SupabaseAuthService, JwtAuthGuard, RolesGuard],
  exports: [SupabaseAuthService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
