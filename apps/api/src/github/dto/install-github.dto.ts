import { IsNumber, IsPositive } from 'class-validator';

export class InstallGithubDto {
  @IsNumber()
  @IsPositive()
  installation_id!: number;
}
