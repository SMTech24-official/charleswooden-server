import { PrismaService } from '@/helper/prisma.service';
import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { Role } from '@/enum/role.enum';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import Stripe from 'stripe';
import { UserStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SubscriptionService {
  private stripe: Stripe;
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SK'), {
      apiVersion: '2025-04-30.basil',
    });
  }

  async createSubscription(dto: CreateSubscriptionDto, user: any) {
    const { paymentMethodId, subscriptionPlanId, name, email } = dto;

    const subscriptionPlan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: subscriptionPlanId },
    });

    if (!subscriptionPlan) {
      throw new HttpException(
        'Subscription plan not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const verifiedUser = await this.prisma.user.findUnique({
      where: { email: user.email, role: Role.CUSTOMER },
    });

    if (
      !verifiedUser ||
      verifiedUser.userStatus === UserStatus.SUSPENDED ||
      verifiedUser.userStatus === UserStatus.BLOCKED ||
      verifiedUser.userStatus === UserStatus.INACTIVE
    ) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    const customer = await this.prisma.customer.findUnique({
      where: { userId: verifiedUser.id },
    });

    if (!customer) {
      throw new HttpException('customer not found', HttpStatus.FORBIDDEN);
    }

    const isAlreadySubscribed = await this.prisma.subscription.findFirst({
      where: { customerId: customer.id, subscriptionStatus: 'ACTIVE' },
      include: { subscriptionPlan: true },
    });

    if (isAlreadySubscribed) {
      throw new HttpException(
        `You are already subscribed to ${isAlreadySubscribed.subscriptionPlan.planName}`,
        HttpStatus.FORBIDDEN,
      );
    }

    let stripeCustomerId = null;

    const isPreviouslySubscribed = await this.prisma.subscription.findFirst({
      where: { customerId: customer.id },
    });

    if (isPreviouslySubscribed?.stripeCustomerId) {
      stripeCustomerId = isPreviouslySubscribed.stripeCustomerId;
    }

    if (!stripeCustomerId) {
      const stripeCustomer = await this.stripe.customers.create({
        email,
        name,
        payment_method: paymentMethodId,
        invoice_settings: { default_payment_method: paymentMethodId },
        metadata: {
          customerId: customer.id,
          subscriptionPlanId: subscriptionPlan.id,
        },
      });

      stripeCustomerId = stripeCustomer.id;
    }

    try {
      const stripeSubscription = await this.stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: subscriptionPlan.stripePriceId }],
        ...(subscriptionPlan.trialPeriod && {
          trial_period_days: 7,
        }),
        metadata: {
          customerId: customer.id,
          subscriptionPlanId: subscriptionPlan.id,
        },
        expand: ['latest_invoice.payment_intent'],
      });

      await this.prisma.customer.update({
        where: { id: customer.id },
        data: { subscriptionStatus: 'PENDING' },
      });

      return stripeSubscription;
    } catch (error) {
      throw new HttpException(
        'Failed to create subscription',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getSubscriptions(userData: any) {
    if (userData.role === Role.CUSTOMER) {
      const customer = await this.prisma.customer.findUnique({
        where: { userId: userData.id },
      });

      return this.prisma.subscription.findMany({
        where: { customerId: customer.id, subscriptionStatus: 'ACTIVE' },
        include: { customer: true },
      });
    } else if (userData.role === Role.ADMIN) {
      return this.prisma.subscription.findMany({
        include: { customer: true },
      });
    }
  }

  async cancelSubscription(
    customerId: string,
    subscriptionId: string,
    userData: any,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { email: userData.email },
    });

    const customer = await this.prisma.customer.findUnique({
      where: { userId: user.id },
    });

    const iscustomerAuthenticated =
      user.role === Role.CUSTOMER && customerId === customer.id;

    if (!iscustomerAuthenticated && user.role === Role.CUSTOMER) {
      throw new HttpException(
        'You cannot cancel another customer’s subscription',
        HttpStatus.FORBIDDEN,
      );
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: {
        id: subscriptionId,
        customerId,
        subscriptionStatus: 'ACTIVE',
      },
    });

    if (!subscription) {
      throw new HttpException(
        'No active subscription found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    return null;
  }

  async updateSubscription(
    customerId: string,
    dto: UpdateSubscriptionDto,
    userData: any,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { email: userData.email },
    });

    const customer = await this.prisma.customer.findUnique({
      where: { userId: user.id },
    });

    const iscustomerAuthenticated =
      user.role === Role.CUSTOMER && customerId === customer.id;

    if (!iscustomerAuthenticated && user.role === Role.CUSTOMER) {
      throw new HttpException(
        'You cannot upgrade another customer’s subscription',
        HttpStatus.FORBIDDEN,
      );
    }

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        customerId,
        subscriptionStatus: 'ACTIVE',
      },
    });

    if (!subscription) {
      throw new HttpException(
        'Active subscription not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const newSubscriptionPlan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.subscriptionPlanId },
    });

    if (!newSubscriptionPlan) {
      throw new HttpException('New plan not found', HttpStatus.NOT_FOUND);
    }

    const stripeSubscription = await this.stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId,
    );

    if (!stripeSubscription) {
      throw new HttpException(
        'Stripe subscription not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return await this.stripe.subscriptions.update(stripeSubscription.id, {
      metadata: {
        subscriptionPlanId: newSubscriptionPlan.id,
      },
      items: [
        {
          id: stripeSubscription.items.data[0].id,
          price: newSubscriptionPlan.stripePriceId,
        },
      ],
      proration_behavior: 'create_prorations',
    });
  }

  async handleWebhook(event: any) {
    const { type, data } = event;

    switch (type) {
      case 'invoice.payment_succeeded':
        console.log('🤑 Payment succeeded:', data.object.subscription);
        break;
      case 'invoice.payment_failed':
        console.log('❌ Payment failed:', data.object.subscription);
        break;
      case 'customer.subscription.created':
        console.log('🔄 Subscription created:', data.object.id);
        break;
      case 'customer.subscription.updated':
        console.log('🔄 Subscription updated:', data.object.id);
        break;
      case 'customer.subscription.deleted':
        console.log('🚫 Subscription canceled:', data.object.id);
        break;
      case 'customer.subscription.trial_will_end':
        console.log('⏳ Trial ending:', data.object.id);
        break;
      default:
        console.log(`Unhandled event type: ${type}`);
        throw new HttpException(
          'Unhandled event type',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }

    return { received: true };
  }
}
