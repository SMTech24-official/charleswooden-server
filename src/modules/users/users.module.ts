import { PrismaService } from '@/helper/prisma.service';
import { Module } from '@nestjs/common';
import { UsersService } from '@/modules/users/users.service';
import { UsersController } from './users.controller';
import { BcryptService } from '@/utils/bcrypt.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService, BcryptService],
  exports: [UsersService],
})
export class UsersModule {}
