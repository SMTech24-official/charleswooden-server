import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@/helper/prisma.service';
import { StripeService } from '@/payment/stripe';
import { IGenericResponse } from '@/interface/common';
import { Transaction } from '@prisma/client';
import QueryBuilder from '@/utils/query_builder';
import { ApiError } from '@/utils/api_error';

@Injectable()
export class TransactionService {
  constructor(
    private prisma: PrismaService,
    private stripe: StripeService,
  ) {}

  async findAll(
    query: Record<string, any>,
  ): Promise<IGenericResponse<Transaction[]>> {
    const populateFields = query.populate
      ? query.populate
          .split(',')
          .reduce((acc: Record<string, boolean>, field) => {
            acc[field] = true;
            return acc;
          }, {})
      : {};

    const queryBuilder = new QueryBuilder(this.prisma.transaction, query);
    const Transactions = await queryBuilder
      .range()
      .search([])
      .filter(['title', 'slug'], [])
      .sort()
      .paginate()
      .fields()
      .populate(populateFields)
      // .include({
      //   tourBooking: true,
      //   roomBooking: true,
      // })
      .execute();

    const meta = await queryBuilder.countTotal();

    return { meta, data: Transactions };
  }

  async findOne(id: string) {
    const isTransactionExists = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!isTransactionExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Transaction Not Found');
    }

    return isTransactionExists;
  }
}
