import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength } from 'class-validator';
import {
  normalizeRootDir,
  REPOSITORY_URL_MESSAGE,
  REPOSITORY_URL_PATTERN,
  ROOT_DIR_MAX_LENGTH,
  ROOT_DIR_MESSAGE,
  ROOT_DIR_PATTERN,
} from './create-project.dto';

// POST /projects/check-root-dir — "does this folder exist in that repository?",
// asked by the forms while the user types, before anything is saved.
export class CheckRootDirDto {
  @IsString()
  @Matches(REPOSITORY_URL_PATTERN, { message: REPOSITORY_URL_MESSAGE })
  @MaxLength(500)
  repository_url!: string;

  @Transform(normalizeRootDir)
  @IsString()
  @Matches(ROOT_DIR_PATTERN, { message: ROOT_DIR_MESSAGE })
  @MaxLength(ROOT_DIR_MAX_LENGTH)
  root_dir!: string;
}
