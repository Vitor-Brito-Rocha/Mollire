import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

// Shared with UpdateProjectDto so create and edit can never disagree on what
// is safe to accept.

// Only https:// GitHub/GitLab URLs accepted — prevents SSRF via file://, git://, ssh://.
export const REPOSITORY_URL_PATTERN = /^https:\/\/(github\.com|gitlab\.com)\/[^/]+\/[^/]/;
export const REPOSITORY_URL_MESSAGE = 'repository_url must be a https://github.com or https://gitlab.com URL';

// Must be a relative path — no leading slash, no .. segments — so the shell
// interpolation in DockerBuildService can't escape the workspace directory.
export const OUTPUT_DIR_PATTERN = /^(?!\.\.)((?!\.\.[/\\]).)*$/;
export const OUTPUT_DIR_MESSAGE = 'output_dir must be a relative path without .. segments';

// Where in the repo the build runs. Stricter than output_dir because it also
// becomes the container's working directory: plain path characters only, no
// "." / ".." segments. "" means the repo root.
export const ROOT_DIR_PATTERN = /^$|^(?!\.{1,2}(\/|$))[\w.-]+(\/(?!\.{1,2}(\/|$))[\w.-]+)*$/;
export const ROOT_DIR_MESSAGE =
  'root_dir must be a relative folder (letters, digits, . _ - and /) without .. segments';
export const ROOT_DIR_MAX_LENGTH = 200;

// "./apps/web/", "/apps/web" and "apps/web" are the same folder; "." and "./"
// mean the root.
export function normalizeRootDir({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim().replace(/^(\.?\/)+/, '').replace(/\/+$/, '');
  return trimmed === '.' ? '' : trimmed;
}

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

  @IsString()
  @IsNotEmpty()
  @Matches(REPOSITORY_URL_PATTERN, { message: REPOSITORY_URL_MESSAGE })
  @MaxLength(500)
  repository_url!: string;

  @IsOptional()
  @Transform(normalizeRootDir)
  @IsString()
  @Matches(ROOT_DIR_PATTERN, { message: ROOT_DIR_MESSAGE })
  @MaxLength(ROOT_DIR_MAX_LENGTH)
  root_dir?: string;

  // Just the build (e.g. "npm run build"): `npm install` is run before it by the platform.
  @IsOptional()
  @IsString()
  @MaxLength(500)
  build_command?: string;

  // Relative to root_dir.
  @IsOptional()
  @IsString()
  @Matches(OUTPUT_DIR_PATTERN, { message: OUTPUT_DIR_MESSAGE })
  @Matches(/^[^/]/, { message: 'output_dir must not start with /' })
  @MaxLength(100)
  output_dir?: string;
}
