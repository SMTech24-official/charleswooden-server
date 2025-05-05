import { Module } from '@nestjs/common';
import { RoomBookingService } from './room-booking.service';
import { RoomBookingController } from './room-booking.controller';
import { PrismaService } from '@/helper/prisma.service';
import { StripeService } from '@/payment/stripe';

@Module({
  controllers: [RoomBookingController],
  providers: [RoomBookingService, PrismaService, StripeService],
})
export class RoomBookingModule {}
