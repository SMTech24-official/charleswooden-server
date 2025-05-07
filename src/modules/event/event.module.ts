import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { PrismaService } from '@/helper/prisma.service';
import { FileService } from '@/helper/file.service';

@Module({
  controllers: [EventController],
  providers: [EventService, FileService, PrismaService],
})
export class EventModule {}
