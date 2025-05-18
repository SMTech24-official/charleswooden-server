import { PrismaService } from '@/helper/prisma.service';
import { IGenericResponse } from '@/interface/common';
import { ApiError } from '@/utils/api_error';
import QueryBuilder from '@/utils/query_builder';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Customer, Prisma, Role } from '@prisma/client';
import { UpdateCustomerDto } from './dto/update-Customer.dto';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    query: Record<string, any>,
  ): Promise<IGenericResponse<Customer[]>> {
    const populateFields = query.populate
      ? query.populate
          .split(',')
          .reduce((acc: Record<string, boolean>, field) => {
            acc[field] = true;
            return acc;
          }, {})
      : {};

    const queryBuilder = new QueryBuilder(this.prisma.user, query);
    const result = await queryBuilder
      .range()
      .search([])
      .filter([], [])
      .sort()
      .paginate()
      .fields()
      .rawFilter({ role: Role.CUSTOMER })
      .populate(populateFields)
      .execute();

    const meta = await queryBuilder.countTotal();

    return { meta, data: result };
  }

  async findOne(id: string) {
    let isCustomerExists = await this.prisma.customer
      .findUnique({
        where: { id },
      })
      .catch(() => null);

    if (!isCustomerExists) {
      isCustomerExists = await this.prisma.customer.findUnique({
        where: { userId: id },
      });
    }

    if (!isCustomerExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Customer Not Found');
    }

    return await this.prisma.user.findUnique({
      where: { id: isCustomerExists?.userId },
      include: { customer: true },
    });
  }

  async update(id: string, data: UpdateCustomerDto) {
    const { customer, ...user } = data;

    const isUserExists = await this.findOne(id);

    const result = await this.prisma.$transaction(async (tx) => {
      const CustomerUpdation = await this.prisma.customer.update({
        where: { id: isUserExists?.customer?.id },
        data: { ...(customer as any) },
      });

      if (!CustomerUpdation) {
        throw new ApiError(HttpStatus.NOT_FOUND, `Customer updation failed`);
      }

      const userUpdation = await this.prisma.user.update({
        where: { id: isUserExists?.id },
        data: { ...user },
      });

      if (!userUpdation) {
        throw new ApiError(HttpStatus.NOT_FOUND, `user updated`);
      }
      return userUpdation;
    });

    return await this.prisma.user.findUnique({
      where: { id: result?.id },
      include: { customer: true },
    });
  }

  async remove(id: string) {
    const isUserExists = await this.findOne(id);

    if (!isUserExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, `user not found`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.answer.findMany({
        where: { customerId: isUserExists?.customer?.id },
      });

      await tx.booking.findMany({
        where: { customerId: isUserExists?.customer?.id },
      });

      const CustomerDeletion = await tx.customer.delete({
        where: { id: isUserExists?.customer.id },
      });

      const userDeletion = await tx.user.delete({
        where: { id: isUserExists.id },
      });
      return userDeletion;
    });

    return 'user deleted successfully';
  }
}
