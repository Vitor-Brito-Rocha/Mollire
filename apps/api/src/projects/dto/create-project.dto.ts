import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  // DNS-label rules: lowercase letters, digits, hyphens; can't start/end with a hyphen.
  // This becomes both the directory name on disk and the subdomain, so it must be safe for both.
  @Matches(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/, {
    message: 'slug must be a valid DNS label (lowercase letters, digits, hyphens)',
  })
  slug!: string;

  // Not restricted to http(s) URLs: SSH remotes (git@host:org/repo.git) are a
  // normal, expected form here too, and IsUrl() would reject that syntax.
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  repository_url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  build_command?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  output_dir?: string;
}
