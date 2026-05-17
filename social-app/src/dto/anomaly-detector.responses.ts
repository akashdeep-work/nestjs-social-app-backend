import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class Factors {
  @IsString()
  @IsNotEmpty()
  factor: string;

  @IsNumber()
  @IsNotEmpty()
  score: number;

  @IsString()
  @IsNotEmpty()
  message: string;
}

export class AnomalousLoginResponse {
  @IsString()
  @IsNotEmpty()
  risk_level: string;

  @IsNumber()
  @IsNotEmpty()
  risk_score: number;

  @IsBoolean()
  @IsNotEmpty()
  is_anomalous: boolean;

  @IsArray()
  @IsNotEmpty()
  factors: Factors[]
}