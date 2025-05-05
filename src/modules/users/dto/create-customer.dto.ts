import { Role } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsString, ValidateNested } from 'class-validator';

export class CustomerDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;
}

// export enum UserRole {
//   ADMIN = 'ADMIN',
//   USER = 'USER',
// }

export class CreateCustomerDto {
  @ValidateNested()
  @Type(() => CustomerDto)
  customer: CustomerDto;

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
