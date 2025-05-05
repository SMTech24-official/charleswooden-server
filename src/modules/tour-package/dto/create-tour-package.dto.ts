import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class CreateTourPackageDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  category: string;

  @IsString()
  location: string;

  @IsString()
  tourType: string;

  @IsNumber()
  duration: string;

  @IsNumber()
  price: number;

  @IsBoolean()
  isVehicleService: boolean;
}
