import { IsEnum, IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export enum BookingStatusEnum {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export class CreateBookingDto {
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @IsMongoId()
  eventId?: string;

  @IsOptional()
  @IsString()
  paymentMethodId: string;

  @IsNotEmpty()
  @IsEnum(BookingStatusEnum, {
    message: `status must be a valid BookingStatus value: ${Object.values(BookingStatusEnum).join(', ')}`,
  })
  status: BookingStatusEnum;
}
