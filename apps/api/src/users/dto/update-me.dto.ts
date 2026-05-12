import { IsArray, IsEnum, IsOptional } from 'class-validator';
import { ActivityType } from '@prisma/client';

export class UpdateMeDto {
  @IsOptional()
  @IsArray()
  @IsEnum(ActivityType, { each: true })
  activityFilter?: ActivityType[];
}
