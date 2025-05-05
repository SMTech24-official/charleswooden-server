import {
  IsDateString,
  IsInt,
  IsMongoId,
  ValidateNested,
  ArrayMinSize,
  IsPositive,
  IsBoolean,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateGuestDto } from './create-guest.dto';

export class CreateTourBookingDto {
  @IsMongoId()
  tourPackageId: string;

  @IsDateString()
  availableDate: string;

  @IsInt()
  @IsPositive()
  duration: number;

  @IsInt()
  @IsPositive()
  groupSize: number;

  @IsMongoId()
  customerId: string;

  @IsBoolean()
  isCancelled: boolean = false;

  @IsString()
  cancelReason: string = '';

  @ValidateNested({ each: true })
  @Type(() => CreateGuestDto)
  @ArrayMinSize(1)
  guests: CreateGuestDto[];
}
