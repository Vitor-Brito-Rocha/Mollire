import { IsString, Length } from 'class-validator';

export class JoinTurmaDto {
  @IsString()
  @Length(4, 12)
  code!: string;
}
