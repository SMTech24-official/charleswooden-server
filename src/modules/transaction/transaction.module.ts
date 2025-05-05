import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { PrismaService } from '@/helper/prisma.service';
import { StripeService } from '@/payment/stripe';

@Module({
  controllers: [TransactionController],
  providers: [TransactionService, PrismaService, StripeService],
})
export class TransactionModule {}
