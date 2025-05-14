import { PrismaService } from '@/helper/prisma.service';
import {
  Injectable,
  HttpException,
  HttpStatus,
  Inject,
  RawBodyRequest,
} from '@nestjs/common';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { Role } from '@/enum/role.enum';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import Stripe from 'stripe';
import { UserStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { ApiError } from '@/utils/api_error';
import { SubscriptionUtil } from './subscription.utils';
import { Request } from 'express';

@Injectable()
export class SubscriptionService {
  private stripe: Stripe;
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private subsriptionUtil: SubscriptionUtil,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SK'), {
      apiVersion: '2025-04-30.basil',
    });
  }

  async createSubscription(dto: CreateSubscriptionDto, user: any) {
    console.log(`Creating subscription for user: `, dto);
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
      throw new HttpException('Account Is Not Active', HttpStatus.FORBIDDEN);
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
      // expand: ['latest_invoice.payment_intent'],
    });

    await this.prisma.customer.update({
      where: { id: customer.id },
      data: { subscriptionStatus: 'PENDING' },
    });

    return stripeSubscription;
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

    const isCustomerAuthenticated =
      user.role === Role.CUSTOMER && customerId === customer.id;

    if (!isCustomerAuthenticated && user.role === Role.CUSTOMER) {
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

  async handleWebhook(req: RawBodyRequest<Request>) {
    const sig = req?.headers['stripe-signature'];
    console.log(`see sig`, sig);
    let event;
    try {
      event = this.stripe.webhooks.constructEvent(
        req?.rawBody,
        sig,
        this.configService.get('STRIPE_WEBHOOK_SK'),
      );
    } catch (error) {
      throw new ApiError(HttpStatus.BAD_REQUEST, `server  error`);
    }
    console.log(`see event`, event?.type);
    switch (event.type) {
      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        console.log(
          '🤑🤑 Subscription Payment Succeeded for:',
          invoice.subscription,
        );
        await this.subsriptionUtil.handleCustomerPayment(invoice);

        break;
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        console.log(
          '❌ Payment Failed for Subscription:',
          failedInvoice.subscription,
        );
        await this.subsriptionUtil.handleFailedPayment(failedInvoice);

        break;
      case 'customer.subscription.created':
        const subscriptionCreated = event.data.object;
        console.log('🔄 Subscription created:', subscriptionCreated.id);
        await this.subsriptionUtil.handleCustomerSubscription(
          subscriptionCreated,
        );

        break;
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        console.log('🔄 Subscription Updated sub_id:', subscription.id);

        await this.subsriptionUtil.handleSubscriptionRenewal(subscription);

        break;

      case 'customer.subscription.deleted':
        const canceledSubscription = event.data.object;
        console.log('🚫 Subscription Canceled:', canceledSubscription.id);
        await this.subsriptionUtil.handleSubscriptionCancellation(
          canceledSubscription,
        );

        break;

      case 'customer.subscription.trial_will_end':
        this.subsriptionUtil.sendExpiryReminder(event.data.object);
        break;
      case 'invoice.created':
        // handleSubscriptionExpiringReminder(event.data.object);
        console.log('✅ invoice.created successfully');
        break;
      case 'invoice.finalized':
        // handleSubscriptionExpiringReminder(event.data.object);
        console.log('✅ invoice.finalized successfully');
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
        throw new ApiError(HttpStatus.BAD_REQUEST, 'unhandled event type');
    }

    return { received: true };
  }
}
