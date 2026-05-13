import { IsNumber, IsString, Min } from 'class-validator';

export class CreateSettlementDto {
  @IsString()
  toUserId!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;
}
