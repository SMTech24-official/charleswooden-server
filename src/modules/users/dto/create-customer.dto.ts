import { Role } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsDateString,
  ValidateNested,
} from 'class-validator';

// Updated enums matching your latest definitions exactly:

export enum DietaryPreference {
  OMNIVORE = 'OMNIVORE',
  VEGETARIAN = 'VEGETARIAN',
  VEGAN = 'VEGAN',
  PESCATARIAN = 'PESCATARIAN',
  KETO = 'KETO',
  PALEO = 'PALEO',
  HALAL = 'HALAL',
  KOSHER = 'KOSHER',
  GLUTEN_FREE = 'GLUTEN_FREE',
  DAIRY_FREE = 'DAIRY_FREE',
  NUT_FREE = 'NUT_FREE',
  OTHER = 'OTHER',
}

export enum PlanName {
  FREE = 'FREE',
  EDGE = 'EDGE',
  VISIONARY = 'VISIONARY',
  QUANTUM = 'QUANTUM',
}

export enum CoupleType {
  MF = 'MF',
  FF = 'FF',
  MM = 'MM',
  OTHER = 'OTHER',
}

export enum ChildrenAgeGroup {
  INFANT = 'INFANT', // 0-1 years
  TODDLER = 'TODDLER', // 1-3 years
  PRESCHOOL = 'PRESCHOOL', // 3-5 years
  SCHOOL_AGE = 'SCHOOL_AGE', // 6-12 years
  TEEN = 'TEEN', // 13-17 years
  ADULT = 'ADULT', // 18+ years
}

export enum RelationshipStatus {
  SINGLE = 'SINGLE',
  IN_RELATIONSHIP = 'IN_RELATIONSHIP',
  MARRIED = 'MARRIED',
  SEPARATED = 'SEPARATED',
  DIVORCED = 'DIVORCED',
  WIDOWED = 'WIDOWED',
}

export enum SubscriptionStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  PAST_DUE = 'PAST_DUE',
}

// export class CustomerDto {
//   @IsString()
//   partnerOneName: string;

//   @IsString()
//   partnerTwoName: string;
// }

export class CustomerDto {
  @IsString()
  partnerOneName: string;

  @IsString()
  partnerTwoName: string;
  // Additional fields below

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(DietaryPreference)
  preference?: DietaryPreference;

  @IsOptional()
  @IsString()
  stripeCustomerId?: string;

  @IsOptional()
  @IsEnum(PlanName)
  planName?: PlanName;

  @IsOptional()
  @IsEnum(CoupleType)
  coupleType?: CoupleType;

  @IsOptional()
  @IsInt()
  children?: number;

  @IsOptional()
  @IsInt()
  grandChildren?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(ChildrenAgeGroup)
  childrenAgeGroup?: ChildrenAgeGroup;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsEnum(RelationshipStatus)
  relationShipStatus: RelationshipStatus;

  @IsOptional()
  @IsEnum(SubscriptionStatus)
  subscriptionStatus?: SubscriptionStatus;
}

// export class CustomerDto {
//   @IsString()
//   partnerOneName: string;

//   @IsString()
//   partnerTwoName: string;
// }

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
