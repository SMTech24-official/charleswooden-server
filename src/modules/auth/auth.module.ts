import { RolesGuard } from '@/modules/roles/roles.guard';
import { UsersModule } from '@/modules/users/users.module';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { BcryptService } from 'src/utils/bcrypt.service';
import { jwtConstants } from './auth.constants';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '@/helper/prisma.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { BrevoService } from '@/email/brevo';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
      HttpModule.register({
        timeout: 5000,

        maxRedirects: 5,
      }),
    UsersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [
    AuthService,
    BcryptService,
    PrismaService,
    UsersService,
    ConfigService,
    BrevoService,
    // by  using this nest js automatically bind every endpoint with AuthGuard
    // { provide: APP_GUARD, useClass: RolesGuard },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
