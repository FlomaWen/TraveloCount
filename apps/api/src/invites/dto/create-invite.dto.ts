import { IsEmail, IsInt, IsOptional, Max, Min } from 'class-validator';

export class CreateInviteDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(720)
  ttlHours?: number;

  @IsOptional()
  @IsEmail()
  email?: string;
}
