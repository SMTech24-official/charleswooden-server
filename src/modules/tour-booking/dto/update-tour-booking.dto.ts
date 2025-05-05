import { PartialType } from '@nestjs/mapped-types';
import { CreateTourBookingDto } from './create-tour-booking.dto';

export class UpdateTourBookingDto extends PartialType(CreateTourBookingDto) {}
