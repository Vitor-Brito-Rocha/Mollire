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

  // Only https:// GitHub/GitLab URLs accepted — prevents SSRF via file://, git://, ssh://.
  @IsString()
  @IsNotEmpty()
  @Matches(/^https:\/\/(github\.com|gitlab\.com)\/[^/]+\/[^/]/, {
    message: 'repository_url must be a https://github.com or https://gitlab.com URL',
  })
  @MaxLength(500)
  repository_url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  build_command?: string;

  // Must be a relative path — no leading slash, no .. segments — so the shell
  // interpolation in DockerBuildService can't escape the workspace directory.
  @IsOptional()
  @IsString()
  @Matches(/^(?!\.\.)((?!\.\.[/\\]).)*$/, {
    message: 'output_dir must be a relative path without .. segments',
  })
  @Matches(/^[^/]/, { message: 'output_dir must not start with /' })
  @MaxLength(100)
  output_dir?: string;
}
