import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class TriggerDeployDto {
  @IsOptional()
  @IsString()
  @Length(7, 40)
  @Matches(/^[0-9a-f]+$/, { message: 'commit_sha must be a hex string' })
  commit_sha?: string;
}
