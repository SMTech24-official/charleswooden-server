import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpStatus,
  HttpException,
  UseInterceptors,
  ClassSerializerInterceptor,
  Req,
  Patch,
  RawBodyRequest,
} from '@nestjs/common';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@/enum/role.enum';
import { SubscriptionService } from './subscription.service';
import { Request } from 'express';
import { Public } from '../auth/auth.decorator';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('subscriptions')
@UseInterceptors(ClassSerializerInterceptor)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  async create(@Body() dto: CreateSubscriptionDto, @Req() req: any) {
    const subscription = await this.subscriptionService.createSubscription(
      dto,
      req?.user,
    );
    return {
      statusCode: HttpStatus.CREATED,
      data: subscription,
    };
  }

  @Get()
  async findAll(@Req() req: any) {
    const subscriptions = await this.subscriptionService.getSubscriptions(
      req?.user,
    );
    return {
      statusCode: HttpStatus.OK,
      data: subscriptions,
    };
  }

  @Patch('cancel/:customerId')
  async cancel(
    @Param('customerId') customerId: string,
    @Param('id') subscriptionId: string,
    @Req() req: any,
  ) {
    try {
      await this.subscriptionService.cancelSubscription(
        customerId,
        subscriptionId,
        req?.user,
      );
      return {
        statusCode: HttpStatus.OK,
        message: 'Subscription canceled successfully.',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to cancel subscription',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 🔁 Upgrade/downgrade subscription plan
  @Patch(':id')
  async update(
    @Param('customerId') customerId: string,
    @Param('id') subscriptionId: string,
    @Body() dto: UpdateSubscriptionDto,
    @Req() req: any,
  ) {
    try {
      const updatedSubscription =
        await this.subscriptionService.updateSubscription(
          customerId,
          dto,
          req?.user,
        );
      return {
        statusCode: HttpStatus.OK,
        data: updatedSubscription,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update subscription',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Public()
  @Post('stripe/webhook')
  async handleWebhook(@Req() req: RawBodyRequest<Request>) {
    try {
      const response = await this.subscriptionService.handleWebhook(req);
      return response;
    } catch (error) {
      throw new HttpException(
        error.message || 'Webhook handling failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
