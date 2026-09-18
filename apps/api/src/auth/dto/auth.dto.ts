import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class CredentialsDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  password!: string;
}

export class EmailDto {
  @IsEmail()
  email!: string;
}

export class PasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  password!: string;
}

export class ConfirmDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  token_hash!: string;

  @IsIn(['signup', 'recovery', 'email_change', 'invite', 'magiclink', 'email'])
  type!: string;
}
