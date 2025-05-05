import { Module } from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { PrismaService } from '@/helper/prisma.service';
import { FileService } from '@/helper/file.service';

@Module({
  controllers: [BlogController],
  providers: [BlogService, PrismaService, FileService],
})
export class BlogModule {}
