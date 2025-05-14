import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@/modules/users/users.service';
import { ApiError } from 'src/utils/api_error';
import { BcryptService } from 'src/utils/bcrypt.service';
import { ConfigService } from '@nestjs/config';
import { BrevoService } from '@/email/brevo';
import { BrevoEmailParams } from '@/interface/brevo';
import { Role } from '@prisma/client';
import { PrismaService } from '@/helper/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private bcryptService: BcryptService,
    private configService: ConfigService,
    private brevoService: BrevoService,
    private prisma: PrismaService,
  ) {}

  async login(data: {
    email: string;
    password: string;
  }): Promise<{ access_token: string; refresh_token: string }> {
    const { email, password } = data;

    const user = await this.usersService.getOne({
      email,
    });

    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'User not found');
    }

    const isPasswordMatched = await this.bcryptService.compare(
      password,
      user.password!,
    );

    if (!isPasswordMatched) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, 'Password is incorrect');
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.username,
      avatar: user.avatar,
    };

    const accessToken = this.jwtService.signAsync(payload);

    const refreshToken = this.jwtService.signAsync(payload);

    return {
      access_token: await accessToken,
      refresh_token: await refreshToken,
    };
  }

  async getMe(user: any) {
    const isUserExists = await this.usersService.getOne({ email: user?.email });

    if (!isUserExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, `user not found`);
    }

    if (user.role === Role.CUSTOMER) {
      const getAllBookings = await this.prisma.booking.findMany({
        where: { customer: { userId: isUserExists?.id } },
        include: {
          customer: { include: { bookings: { include: { event: true } } } },
        },
      });

      // let running: 0, attended: 0, cancelled: 0;
      // const differs = getAllBookings?.map((event: Event) => {

      //   if(event.)

      // });
    }
  }

  async forgetPassword({ email }: { email: string }) {
    const user = await this.usersService.getOne({ email });

    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, `User Not Found`);
    }

    const payload = {
      email: user.email,
      role: user.role,
    };

    const resetPassToken = this.jwtService.signAsync(payload);

    const resetPasswordLink =
      this.configService.get(`RESET_PASSWORD_LINK`) +
      `?userId=${user.id}&token=${resetPassToken}`;

    const params: BrevoEmailParams = {
      sender: { email: 'info@fourteencapital.com', name: 'Fourteen Capital' },
      to: [{ email: user?.email, name: user?.username }],
      subject: 'FourteenCapital - Reset Your Password',
      htmlContent: `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa; margin: 0; padding: 20px; line-height: 1.6; color: #333333;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #FF7600; padding: 30px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Password Reset Request</h1>
            </div>
            <div style="padding: 40px 30px;">
                <p style="font-size: 16px; margin-bottom: 20px;">Dear User,</p>
                
                <p style="font-size: 16px; margin-bottom: 30px;">We received a request to reset your password. Click the button below to reset your password:</p>
                
                <div style="text-align: center; margin-bottom: 30px;">
                    <a href=${resetPasswordLink} style="display: inline-block; background-color: #FF7600; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: 600; transition: background-color 0.3s ease;">
                        Reset Password
                    </a>
                </div>
                
                <p style="font-size: 16px; margin-bottom: 20px;">If you did not request a password reset, please ignore this email or contact support if you have any concerns.</p>
                
                <p style="font-size: 16px; margin-bottom: 0;">Best regards,<br>Your Support Team</p>
            </div>
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #6c757d;">
                <p style="margin: 0 0 10px;">This is an automated message, please do not reply to this email.</p>
                <p style="margin: 0;">© 2023 Your Company Name. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>`,
      // optional:
      // cc: [ { email: 'boss@company.com', name: 'Boss' } ],
      // bcc: [ ... ],
      // textContent: 'Plain-text fallback here',
      // attachmentUrls: ['https://.../file.pdf'],
    };

    await this.brevoService.sendEmail(params);

    return {
      message: 'Reset password link sent via your email successfully',
    };
  }

  async resetPassword({
    token,
    payload: { id, password },
  }: {
    token: string;
    payload: { id: string; password: string };
  }) {
    const user = this.usersService.getOne({ email: id });

    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, `User Not Found`);
    }

    const isValidToken = await this.jwtService.verifyAsync(token);

    if (!isValidToken) {
      throw new ApiError(HttpStatus.FORBIDDEN, `Forbidden`);
    }

    const hashPassword = await this.bcryptService.hash(password);

    await this.usersService.updatePassword({
      id: (await user)?.id,
      password: hashPassword,
    });
  }
}
