import { IsEnum, IsNotEmpty, IsNumber, Min } from 'class-validator';

export enum VehicleType {
  BOAT = 'BOAT',
  CAR = 'CAR',
  VAN = 'VAN',
  AIRCRAFT = 'AIRCRAFT',
}

export class CreateVehicleDto {
  @IsNotEmpty()
  name: string;

  @IsEnum(VehicleType, {
    message: 'vehicleType must be one of BOAT, CAR, VAN, AIRCRAFT',
  })
  vehicleType: VehicleType;

  @IsNumber()
  @Min(0, { message: 'pricePerHR must be zero or a positive number' })
  pricePerHR: number;
}
