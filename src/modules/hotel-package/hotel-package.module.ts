import { Module } from '@nestjs/common';
import { HotelPackageService } from './hotel-package.service';
import { HotelPackageController } from './hotel-package.controller';
import { PrismaService } from '@/helper/prisma.service';
import { FileService } from '@/helper/file.service';

@Module({
  controllers: [HotelPackageController],
  providers: [HotelPackageService, PrismaService, FileService],
})
export class HotelPackageModule {}
