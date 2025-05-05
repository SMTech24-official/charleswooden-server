import {
  IsDateString,
  IsInt,
  IsMongoId,
  ValidateNested,
  ArrayMinSize,
  IsPositive,
  IsString,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateGuestDto } from './create-guest.dto';

export class CreateRoomBookingDto {
  @IsDateString()
  checkInDate: string;

  @IsDateString()
  checkOutDate: string;

  @IsInt()
  @IsPositive()
  numberOfGuests: number;

  @IsString()
  roomType: string;

  @IsBoolean()
  isCancelled: boolean = false;

  @IsString()
  cancelReason: string = '';

  @IsMongoId()
  customerId: string;

  @ValidateNested({ each: true })
  @Type(() => CreateGuestDto)
  @ArrayMinSize(1)
  guests: CreateGuestDto[];
}
