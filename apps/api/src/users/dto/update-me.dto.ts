import { IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { FRAME_IDS } from '../../common/frames';

// Both fields optional (the handle form and the frame picker send one each),
// but at least one must be present — checked in UsersService.updateMe.
export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/i, {
    message: 'handle may contain letters, digits, ".", "_" and "-", and must start and end with a letter or digit',
  })
  handle?: string;

  @IsOptional()
  @IsIn(FRAME_IDS)
  frame?: string;
}
