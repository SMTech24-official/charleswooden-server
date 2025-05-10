import { Module } from '@nestjs/common';
import { SubscriptionPlanService } from './subscription-plan.service';
import { SubscriptionPlanController } from './subscription-plan.controller';
import { PrismaService } from '@/helper/prisma.service';

@Module({
  controllers: [SubscriptionPlanController],
  providers: [SubscriptionPlanService, PrismaService],
})
export class SubscriptionPlanModule {}
