import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum BookingStatusEnum {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  // Add all possible values exactly as in your Prisma schema
}

export class CreateBookingDto {
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @IsOptional()
  @IsString()
  eventId?: string;

  @IsNotEmpty()
  @IsEnum(BookingStatusEnum, {
    message: `status must be a valid BookingStatus value: ${Object.values(BookingStatusEnum).join(', ')}`,
  })
  status: BookingStatusEnum;
}
