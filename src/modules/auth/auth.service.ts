import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@/modules/users/users.service';
import { ApiError } from 'src/utils/api_error';
import { BcryptService } from 'src/utils/bcrypt.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private bcryptService: BcryptService,
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
}
