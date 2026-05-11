import { IsEnum, IsInt, IsLatitude, IsLongitude, IsOptional, IsString, Length, Matches, Min } from 'class-validator';
import { ItineraryType } from '@prisma/client';

export class CreateItineraryItemDto {
  @IsInt()
  @Min(1)
  day!: number;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'time must be HH:MM (24h)' })
  time?: string;

  @IsEnum(ItineraryType)
  type!: ItineraryType;

  @IsString()
  @Length(1, 120)
  title!: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  details?: string;

  @IsOptional()
  @IsString()
  @Length(0, 250)
  address?: string;

  @IsOptional()
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @IsLongitude()
  lng?: number;
}
