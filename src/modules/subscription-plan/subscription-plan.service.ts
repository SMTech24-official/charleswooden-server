import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { SubscribePlan, Subscription } from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '@/helper/prisma.service';
import { ConfigService } from '@nestjs/config';
import { IGenericResponse } from '@/interface/common';
import QueryBuilder from '@/utils/query_builder';

@Injectable()
export class SubscriptionPlanService {
  private stripe: Stripe;
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SK'), {
      apiVersion: '2025-04-30.basil',
    });
  }

  async createSubscriptionPlan(user: any, dto: CreateSubscriptionPlanDto) {
    // Check if user is admin
    const admin = await this.prisma.user.findUnique({
      where: { id: user.id, role: user.role },
    });

    if (!admin) {
      throw new HttpException(
        'Only admin or super admin can create subscription plans',
        HttpStatus.FORBIDDEN,
      );
    }

    // Check for existing plan name
    const existingPlan = await this.prisma.subscriptionPlan.findFirst({
      where: { planName: dto.planName },
    });

    if (existingPlan) {
      throw new HttpException(
        'A subscription plan with the same name already exists',
        HttpStatus.CONFLICT,
      );
    }

    let stripePriceId: string;

    if (dto.planName === 'FREE') {
      return await this.prisma.subscriptionPlan.create({
        data: {
          planName: 'FREE',
          ...dto,
          price: 0,
          // plan: dto.plan.toUpperCase(),
        },
      });
    } else {
      const stripePrice = await this.stripe.prices.create({
        unit_amount: Math.round(dto.price * 100),
        currency: 'usd',
        recurring: {
          interval: dto.plan.toLowerCase() as Stripe.Price.Recurring.Interval,
        },
        product_data: {
          name: dto.planName,
          metadata: {
            description: dto.description,
          },
        },
      });

      stripePriceId = stripePrice.id;

      console.log(`see stripePriceId`, stripePrice);

      console.log(`see data`, {
        ...dto,
        stripePriceId,
        plan: dto.plan as SubscribePlan,
      });

      return await this.prisma.subscriptionPlan.create({
        data: {
          ...dto,
          stripePriceId,
          plan: dto.plan as SubscribePlan,
        },
      });
    }
  }

  async getSubscriptionPlans() {
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { status: 'ACTIVE' },
    });

    if (plans.length === 0) return [];

    const customOrder = ['FREE', 'BASIC', 'PREMIUM', 'PRO'];
    return plans.sort(
      (a, b) =>
        customOrder.indexOf(a.planName) - customOrder.indexOf(b.planName),
    );
  }

  async getSubscriptionPlanCustomers(
    query: Record<string, any>,
  ): Promise<IGenericResponse<Subscription[]>> {
    const populateFields = query.populate
      ? query.populate
          .split(',')
          .reduce((acc: Record<string, boolean>, field) => {
            acc[field] = true;
            return acc;
          }, {})
      : {};

    const queryBuilder = new QueryBuilder(this.prisma.subscription, query);
    const result = await queryBuilder
      .range()
      .search([])
      .filter([], [])
      .sort()
      .paginate()
      .fields()
      .populate(populateFields)
      .execute();

    const meta = await queryBuilder.countTotal();

    return { meta, data: result };
  }

  async getSubscriptionPlanById(planId: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new HttpException(
        'Subscription plan not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return plan;
  }

  async getAdminSubscriptionPlans() {
    const plans = await this.prisma.subscriptionPlan.findMany();

    if (!plans) {
      throw new HttpException(
        'No subscription plans found',
        HttpStatus.NOT_FOUND,
      );
    }

    const customOrder = ['FREE', 'BASIC', 'PREMIUM', 'PRO'];
    return plans.sort(
      (a, b) =>
        customOrder.indexOf(a.planName) - customOrder.indexOf(b.planName),
    );
  }

  async updateSubscriptionPlan(planId: string, dto: UpdateSubscriptionPlanDto) {
    const currentPlan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!currentPlan) {
      throw new HttpException(
        'Subscription plan not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if plan name already exists
    if (dto.planName && dto.planName !== currentPlan.planName) {
      const existingPlan = await this.prisma.subscriptionPlan.findFirst({
        where: { planName: dto.planName },
      });

      if (existingPlan) {
        throw new HttpException(
          `A subscription plan with name ${dto.planName} already exists`,
          HttpStatus.CONFLICT,
        );
      }
    }

    // Handle FREE plan special case
    if (currentPlan.planName === 'FREE') {
      return await this.prisma.subscriptionPlan.update({
        where: { id: planId },
        data: {
          ...dto,
          price: 0,
        },
      });
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        let stripePriceId = currentPlan.stripePriceId;

        // If price or plan type changed, update Stripe price
        if (dto.price || dto.plan) {
          // Archive old price
          if (currentPlan.stripePriceId) {
            await this.stripe.prices.update(currentPlan.stripePriceId, {
              active: false,
            });
          }

          // Create new price
          const newPrice = await this.stripe.prices.create({
            unit_amount: dto.price
              ? Math.round(dto.price * 100)
              : Math.round(currentPlan.price * 100),
            currency: 'usd',
            recurring: {
              interval: (dto.plan?.toLowerCase() ||
                currentPlan.plan.toLowerCase()) as Stripe.Price.Recurring.Interval,
            },
            product_data: {
              name: dto.planName || currentPlan.planName,
              metadata: {
                description: dto.description || currentPlan.description,
              },
            },
          });

          stripePriceId = newPrice.id;
        }

        // Update subscription plan
        return await tx.subscriptionPlan.update({
          where: { id: planId },
          data: {
            ...dto,
            plan: dto.plan,
            stripePriceId,
          },
        });
      });
    } catch (error) {
      throw new HttpException(
        'Failed to update subscription plan',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
