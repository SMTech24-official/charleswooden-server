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
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@/enum/role.enum';

@Controller('subscriptions')
@UseInterceptors(ClassSerializerInterceptor)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async create(@Body() dto: CreateSubscriptionDto, @Req() req: any) {
    try {
      const subscription = await this.subscriptionService.createSubscription(
        dto,
        req?.user,
      );
      return {
        statusCode: HttpStatus.CREATED,
        data: subscription,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create subscription',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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

  // 🧾 Get subscription by ID
  @Post('webhook')
  async handleWebhook(@Body() event: any) {
    try {
      const response = await this.subscriptionService.handleWebhook(event);
      return response;
    } catch (error) {
      throw new HttpException(
        error.message || 'Webhook handling failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
