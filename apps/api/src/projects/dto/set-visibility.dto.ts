import { IsBoolean } from 'class-validator';

export class SetVisibilityDto {
  @IsBoolean()
  is_public!: boolean;
}
