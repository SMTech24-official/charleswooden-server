import { IsMongoId, IsString } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  paymentMethodId: string;

  @IsMongoId()
  subscriptionPlanId: string;

  @IsString()
  name: string;

  @IsString()
  email: string;
}
