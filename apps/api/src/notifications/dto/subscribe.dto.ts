import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class SubscribeDto {
  @IsUrl({ require_tld: false })
  endpoint!: string;

  @IsString()
  @IsNotEmpty()
  p256dh!: string;

  @IsString()
  @IsNotEmpty()
  auth!: string;

  @IsOptional()
  @IsString()
  user_agent?: string;
}
