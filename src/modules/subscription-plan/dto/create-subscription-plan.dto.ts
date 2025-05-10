import {
  IsEnum,
  IsOptional,
  IsBoolean,
  IsString,
  IsNumber,
  ValidateIf,
} from 'class-validator';
import {
  SubscribePlan,
  SubscriptionPlanStatus,
  PlanName,
} from '@prisma/client';

export class CreateSubscriptionPlanDto {
  @IsEnum(SubscribePlan)
  @IsOptional()
  plan?: SubscribePlan;

  @IsEnum(SubscriptionPlanStatus)
  @IsOptional()
  status?: SubscriptionPlanStatus;

  @IsEnum(PlanName)
  @IsOptional()
  planName?: PlanName;

  @IsString()
  description: string;

  @IsBoolean()
  @IsOptional()
  trialPeriod?: boolean;

  @IsNumber({ allowNaN: false, maxDecimalPlaces: 2 })
  @IsOptional()
  price?: number;

  @ValidateIf((dto) => dto.price !== undefined && dto.price > 0)
  @IsString()
  stripePriceId?: string;
}
