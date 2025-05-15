import { PrismaService } from '@/helper/prisma.service';
import { IGenericResponse } from '@/interface/common';
import { ApiError } from '@/utils/api_error';
import QueryBuilder from '@/utils/query_builder';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Booking, Prisma } from '@prisma/client';

@Injectable()
export class BookingService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.BookingCreateInput) {
    return this.prisma.booking.create({
      data: { ...data },
    });
  }

  async findAll(
    query: Record<string, any>,
  ): Promise<IGenericResponse<Booking[]>> {
    const populateFields = query.populate
      ? query.populate
          .split(',')
          .reduce((acc: Record<string, boolean>, field) => {
            acc[field] = true;
            return acc;
          }, {})
      : {};

    const queryBuilder = new QueryBuilder(this.prisma.booking, query);
    const Bookings = await queryBuilder
      .range()
      .search([])
      .filter(['title', 'slug'], [])
      .sort()
      .paginate()
      .fields()
      .populate(populateFields)
      .execute();

    const meta = await queryBuilder.countTotal();

    return { meta, data: Bookings };
  }

  async findOne(id: string) {
    const isBookingExists = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!isBookingExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Booking Not Found');
    }

    return isBookingExists;
  }

  async update(id: string, data: Prisma.BookingUpdateInput) {
    const isBookingExists = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!isBookingExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Booking Not Found');
    }

    return this.prisma.booking.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const isBookingExists = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!isBookingExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Booking Not Found');
    }

    return await this.prisma.booking.delete({
      where: { id },
    });
  }
}
