import { PrismaService } from '@/helper/prisma.service';
import { IGenericResponse } from '@/interface/common';
import { ApiError } from '@/utils/api_error';
import QueryBuilder from '@/utils/query_builder';
import { HttpStatus, Injectable } from '@nestjs/common';
import { SubscriptionPlan, Prisma } from '@prisma/client';

@Injectable()
export class SubscriptionPlanService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.SubscriptionPlanCreateInput) {
    return this.prisma.subscriptionPlan.create({
      data: { ...data },
    });
  }

  async findAll(
    query: Record<string, any>,
  ): Promise<IGenericResponse<SubscriptionPlan[]>> {
    const populateFields = query.populate
      ? query.populate
          .split(',')
          .reduce((acc: Record<string, boolean>, field) => {
            acc[field] = true;
            return acc;
          }, {})
      : {};

    const queryBuilder = new QueryBuilder(this.prisma.subscriptionPlan, query);
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

  async findOne(id: string) {
    const isSubscriptionPlanExists = await this.prisma.subscriptionPlan
      .findUnique({
        where: { id },
      })
      .catch(() => null);

    if (!isSubscriptionPlanExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'SubscriptionPlan Not Found');
    }

    return isSubscriptionPlanExists;
  }

  async update(id: string, data: Prisma.SubscriptionPlanUpdateInput) {
    const isSubscriptionPlanExists =
      await this.prisma.subscriptionPlan.findUnique({
        where: { id },
      });

    if (!isSubscriptionPlanExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'SubscriptionPlan Not Found');
    }

    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: { ...data },
    });
  }

  async remove(id: string) {
    const isSubscriptionPlanExists =
      await this.prisma.subscriptionPlan.findUnique({
        where: { id },
      });

    if (!isSubscriptionPlanExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'SubscriptionPlan Not Found');
    }

    return await this.prisma.subscriptionPlan.delete({
      where: { id },
    });
  }
}
