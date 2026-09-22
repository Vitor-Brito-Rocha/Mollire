import { IsString } from 'class-validator';

export class SubmitProjectDto {
  @IsString()
  project_slug!: string;
}
