import { Module } from '@nestjs/common';
import { FeedBackController } from './feedback.controller';
import { FeedBackService } from './feedback.service';
@Module({
  controllers: [FeedBackController],
  providers: [FeedBackService],
})
export class FeedbackModule {}
