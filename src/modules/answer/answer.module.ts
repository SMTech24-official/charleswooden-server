import { Module } from '@nestjs/common';
import { AnswerService } from './answer.service';
import { AnswerController } from './answer.controller';
import { PrismaService } from '@/helper/prisma.service';

@Module({
  controllers: [AnswerController],
  providers: [AnswerService, PrismaService],
})
export class AnswerModule {}
