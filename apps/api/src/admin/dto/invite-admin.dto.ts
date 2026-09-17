import { IsEmail } from 'class-validator';

export class InviteAdminDto {
  @IsEmail()
  email!: string;
}
