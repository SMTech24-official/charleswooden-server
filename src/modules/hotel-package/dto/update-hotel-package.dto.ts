import { PartialType } from '@nestjs/mapped-types';
import { CreateHotelPackageDto } from './create-hotel-package.dto';

export class UpdateHotelPackageDto extends PartialType(CreateHotelPackageDto) {}
