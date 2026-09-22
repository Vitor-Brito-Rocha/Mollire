import { IsInt, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @MaxLength(60)
  name!: string;

  @IsInt()
  @Min(1)
  @Max(200)
  max_size!: number;
}
