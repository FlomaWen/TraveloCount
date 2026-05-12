import { IsEnum, IsInt, IsLatitude, IsLongitude, IsOptional, IsString, Length, Matches, Min } from 'class-validator';
import { ItineraryType } from '@prisma/client';

export class UpdateItineraryItemDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  day?: number;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'time must be HH:MM (24h)' })
  time?: string | null;

  @IsOptional()
  @IsEnum(ItineraryType)
  type?: ItineraryType;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  details?: string | null;

  @IsOptional()
  @IsString()
  @Length(0, 250)
  address?: string | null;

  @IsOptional()
  @IsLatitude()
  lat?: number | null;

  @IsOptional()
  @IsLongitude()
  lng?: number | null;
}
