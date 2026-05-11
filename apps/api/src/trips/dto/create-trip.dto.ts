import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { TripAmbiance } from '@prisma/client';

export class CreateTripDto {
  @IsString()
  @Length(1, 100)
  title!: string;

  @IsOptional()
  @IsString()
  @Length(0, 120)
  destination?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(TripAmbiance)
  ambiance?: TripAmbiance;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  budget?: number;
}
