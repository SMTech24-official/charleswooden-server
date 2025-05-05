import {
  IsString,
  IsEmail,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

export class CreateGuestDto {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsBoolean()
  isAdult: boolean;

  @IsInt()
  @Min(0)
  @Max(120)
  age: number;

  @IsString()
  contactNo: string;

  @IsString()
  requestMessage: string;
}
