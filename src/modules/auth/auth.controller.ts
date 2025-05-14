import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { LoginDto } from './dto/login.dto';
import { Public } from './auth.decorator';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Public()
  @Post('login')
  async signIn(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);
    return result;
  }

  @Get('get-me')
  getProfile(@Req() req: Request) {
    const user: any = req?.user;
    return this.authService.getMe(user);
  }

  @Post('forgot-password')
  async forgotPasswod(@Body() data: { email: string }) {
    return await this.authService.forgetPassword({ email: data?.email });
  }

  @Post('reset-password')
  async resetPassword(
    @Headers('authorization') token: string,
    @Body() payload: { id: string; password: string },
  ) {
    return this.authService.resetPassword({
      token,
      payload: {
        id: payload.id,
        password: payload.password,
      },
    });
  }
}
