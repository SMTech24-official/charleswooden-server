import { Role } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsString, ValidateNested } from 'class-validator';

export class AdminDto {
  @IsString()
  fullName: string;

  @IsString()
  location: string;
}

// export enum UserRole {
//   ADMIN = 'ADMIN',
//   USER = 'USER',
// }

export class CreateAdminDto {
  @ValidateNested()
  @Type(() => AdminDto)
  admin: AdminDto;

  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  contactNo: string;

  @IsEnum(Role)
  role: Role;
}
