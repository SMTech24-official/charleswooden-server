import { BookModule } from '@/modules/book/book.module';
import { UsersModule } from '@/modules/users/users.module';
import { UsersService } from '@/modules/users/users.service';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import config from '../config';
import { PrismaService } from '@/helper/prisma.service';
import { BcryptService } from '@/utils/bcrypt.service';
import { GlobalExceptionFilter } from '@/utils/global_exception';
import { AppController } from './app.controller';
import { WebSocketService } from '@/ws/websocket.service';
import { AuthModule } from '@/modules/auth/auth.module';
import { BlogModule } from '@/modules/blog/blog.module';
import { TourPackageModule } from '@/modules/tour-package/tour-package.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HotelPackageModule } from '@/modules/hotel-package/hotel-package.module';
import { TourBookingModule } from '@/modules/tour-booking/tour-booking.module';
import { VehicleModule } from '@/modules/vehicle/vehicle.module';
import { RoomBookingModule } from '@/modules/room-booking/room-booking.module';
import { TransactionModule } from '@/modules/transaction/transaction.module';
import { AuthGuard } from '@/modules/auth/auth.guard';
import { RolesGuard } from '@/modules/roles/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'short',
          ttl: 1000,
          limit: 3,
        },
        {
          name: 'medium',
          ttl: 10000,
          limit: 200,
        },
        {
          name: 'long',
          ttl: 600000,
          limit: 100,
        },
      ],
    }),
    BookModule,
    AuthModule,
    UsersModule,
    BlogModule,
    TourPackageModule,
    HotelPackageModule,
    TourBookingModule,
    VehicleModule,
    RoomBookingModule,
    TransactionModule,
  ],
  controllers: [AppController],
  providers: [
    UsersService,
    PrismaService,
    BcryptService,
    WebSocketService,
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
