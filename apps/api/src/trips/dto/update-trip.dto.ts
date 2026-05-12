import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { SplitMethod } from '@prisma/client';

export class UpdateTripDto {
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsEnum(SplitMethod)
  defaultSplitMethod?: SplitMethod;
}
