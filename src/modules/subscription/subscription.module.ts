import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { PrismaService } from '@/helper/prisma.service';
import { ConfigService } from '@nestjs/config';
import { FileService } from '@/helper/file.service';
import { SubscriptionUtil } from './subscription.utils';
import { BrevoService } from '@/email/brevo';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [SubscriptionController],
  providers: [
    SubscriptionService,
    PrismaService,
    ConfigService,
    FileService,
    SubscriptionUtil,
    BrevoService,
  ],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
