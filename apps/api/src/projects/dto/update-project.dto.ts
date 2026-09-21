import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import {
  normalizeRootDir,
  OUTPUT_DIR_MESSAGE,
  OUTPUT_DIR_PATTERN,
  REPOSITORY_URL_MESSAGE,
  REPOSITORY_URL_PATTERN,
  ROOT_DIR_MAX_LENGTH,
  ROOT_DIR_MESSAGE,
  ROOT_DIR_PATTERN,
} from './create-project.dto';

// PATCH /projects/:slug — every field optional, only what's sent changes.
// The slug is deliberately not editable: it is the subdomain, the directory on
// disk and the address of every link already shared.
export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'name should not be empty' })
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(REPOSITORY_URL_PATTERN, { message: REPOSITORY_URL_MESSAGE })
  @MaxLength(500)
  repository_url?: string;

  // "" is allowed here: it sends the build back to the repo root.
  @IsOptional()
  @Transform(normalizeRootDir)
  @IsString()
  @Matches(ROOT_DIR_PATTERN, { message: ROOT_DIR_MESSAGE })
  @MaxLength(ROOT_DIR_MAX_LENGTH)
  root_dir?: string;

  // Just the build; `npm install` is run before it by the platform.
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  build_command?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(OUTPUT_DIR_PATTERN, { message: OUTPUT_DIR_MESSAGE })
  @Matches(/^[^/]/, { message: 'output_dir must not start with /' })
  @MaxLength(100)
  output_dir?: string;
}
