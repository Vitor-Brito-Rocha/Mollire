import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { TurmaGroupMode } from '@prisma/client';

export class CreateTurmaGroupInput {
  @IsString()
  @MaxLength(60)
  name!: string;

  @IsInt()
  @Min(1)
  @Max(200)
  max_size!: number;
}

export class CreateTurmaDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  capacity?: number;

  @IsOptional()
  @IsEnum(TurmaGroupMode)
  group_mode?: TurmaGroupMode;

  // Only read when group_mode is GROUPS: the groups students will join after
  // entering the turma. Names must be distinct — see @@unique([turma_id, name]).
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CreateTurmaGroupInput)
  groups?: CreateTurmaGroupInput[];
}
