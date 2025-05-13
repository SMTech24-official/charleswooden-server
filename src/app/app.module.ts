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
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthGuard } from '@/modules/auth/auth.guard';
import { RolesGuard } from '@/modules/roles/roles.guard';
import { CategoryModule } from '@/modules/category/category.module';
import { QuestionModule } from '@/modules/question/question.module';
import { AnswerModule } from '@/modules/answer/answer.module';
import { EventModule } from '@/modules/event/event.module';
import { SubscriptionPlanModule } from '@/modules/subscription-plan/subscription-plan.module';
import { SubscriptionModule } from '@/modules/subscription/subscription.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,

      maxRedirects: 5,
    }),
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
    AuthModule,
    UsersModule,
    BlogModule,
    CategoryModule,
    QuestionModule,
    AnswerModule,
    EventModule,
    SubscriptionPlanModule,
    SubscriptionModule,
  ],
  controllers: [AppController],
  providers: [
    UsersService,
    PrismaService,
    BcryptService,
    WebSocketService,
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    // { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard }, // authentication guard
    { provide: APP_GUARD, useClass: RolesGuard }, //authorization guard
  ],
  exports: [HttpModule],
})
export class AppModule {}
