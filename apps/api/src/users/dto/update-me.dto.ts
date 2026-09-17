import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateMeDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/i, {
    message: 'handle may contain letters, digits, ".", "_" and "-", and must start and end with a letter or digit',
  })
  handle!: string;
}
