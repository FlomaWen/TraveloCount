import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { ExpenseCategory, SplitMethod } from '@prisma/client';

export class ExpenseParticipantDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  value?: number;
}

export class CreateExpenseDto {
  @IsString()
  @Length(1, 120)
  label!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsEnum(ExpenseCategory)
  category!: ExpenseCategory;

  @IsDateString()
  date!: string;

  @IsString()
  payerId!: string;

  @IsEnum(SplitMethod)
  splitMethod!: SplitMethod;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExpenseParticipantDto)
  participants!: ExpenseParticipantDto[];
}
