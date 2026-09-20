import { IsString, MaxLength } from 'class-validator';

export class UpsertEnvVarDto {
  @IsString()
  @MaxLength(32768)
  value: string;
}
