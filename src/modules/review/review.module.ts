import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { PrismaService } from '@/helper/prisma.service';
import { FileService } from '@/helper/file.service';

@Module({
  controllers: [ReviewController],
  providers: [ReviewService, FileService, PrismaService],
})
export class ReviewModule {}
