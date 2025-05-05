import { IsString, IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHotelPackageDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  slug: string;

  @IsString()
  roomCategory: string;

  @IsString()
  duration: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  bedRoom: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  bathRoom: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  livingRoom: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  kitchen: number;
}
