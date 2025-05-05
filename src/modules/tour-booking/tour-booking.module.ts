import { Module } from '@nestjs/common';
import { TourBookingService } from './tour-booking.service';
import { TourBookingController } from './tour-booking.controller';
import { PrismaService } from '@/helper/prisma.service';
import { FileService } from '@/helper/file.service';
import { StripeService } from '@/payment/stripe';

@Module({
  controllers: [TourBookingController],
  providers: [TourBookingService, PrismaService, FileService, StripeService],
})
export class TourBookingModule {}
