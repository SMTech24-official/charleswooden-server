import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { PrismaService } from '@/helper/prisma.service';
import { ConfigService } from '@nestjs/config';
import { FileService } from '@/helper/file.service';

@Module({
  controllers: [SubscriptionController],
  providers: [SubscriptionService, PrismaService, ConfigService, FileService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
