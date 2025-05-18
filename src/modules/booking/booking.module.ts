import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { StripeService } from '@/payment/stripe';

@Module({
  controllers: [BookingController],
  providers: [BookingService,StripeService],
})
export class BookingModule {}
