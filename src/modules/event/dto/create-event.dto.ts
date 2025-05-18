import {
  IsString,
  IsDate,
  IsOptional,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';
import { Transform } from 'class-transformer';
export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  location?: string;

  @Transform(({ value }) => new Date(value))
  @IsDate()
  date: Date;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;

  @IsString()
  estimatedBudget: string;

  @IsNumber()
  entryFee: number;
}
