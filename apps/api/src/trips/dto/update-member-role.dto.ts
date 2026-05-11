import { IsEnum } from 'class-validator';
import { TripRole } from '@prisma/client';

export class UpdateMemberRoleDto {
  @IsEnum(TripRole)
  role!: TripRole;
}
