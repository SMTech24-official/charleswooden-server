import { PrismaService } from '@/helper/prisma.service';
import { IGenericResponse } from '@/interface/common';
import { ApiError } from '@/utils/api_error';
import QueryBuilder from '@/utils/query_builder';
import { HttpStatus, Injectable } from '@nestjs/common';
import {
  TourBooking,
  Prisma,
  Guest,
  Currency,
  PaymentStatus,
} from '@prisma/client';
import { CreateTourBookingDto } from './dto/create-tour-booking.dto';
import { StripeService } from '@/payment/stripe';

@Injectable()
export class TourBookingService {
  constructor(
    private prisma: PrismaService,
    private stripe: StripeService,
  ) {}

  async create(data: CreateTourBookingDto) {
    const { guests, ...tourBookingData } = data;

    const result = await this.prisma.$transaction(async (tx) => {
      const tourBookingCreation = await this.prisma.tourBooking.create({
        data: { ...tourBookingData },
      });

      if (!tourBookingCreation) {
        throw new ApiError(
          HttpStatus.BAD_REQUEST,
          'TourBooking creation failed',
        );
      }

      if (guests && Array.isArray(guests) && guests.length > 0) {
        const guestCreation = await Promise.all(
          guests.map(async (guest: Guest) => {
            return tx.guest.create({
              data: {
                ...guest,
                tourBookingId: tourBookingCreation.id,
              },
            });
          }),
        );

        const guestCreationResult = await Promise.all(guestCreation);

        if (!guestCreationResult) {
          throw new ApiError(HttpStatus.BAD_REQUEST, 'Guest creation failed');
        }
      }

      return tourBookingCreation;
    });

    return await this.prisma.tourBooking.findUnique({
      where: { id: result.id },
      include: {
        guests: true,
      },
    });
  }

  async findAll(
    query: Record<string, any>,
  ): Promise<IGenericResponse<TourBooking[]>> {
    const populateFields = query.populate
      ? query.populate
          .split(',')
          .reduce((acc: Record<string, boolean>, field) => {
            acc[field] = true;
            return acc;
          }, {})
      : {};

    const queryBuilder = new QueryBuilder(this.prisma.tourBooking, query);
    const TourBookings = await queryBuilder
      .range()
      .search([])
      .filter(['title', 'slug'], [])
      .sort()
      .paginate()
      .fields()
      .populate(populateFields)
      .execute();

    const meta = await queryBuilder.countTotal();

    return { meta, data: TourBookings };
  }

  async findOne(id: string) {
    const isTourBookingExists = await this.prisma.tourBooking.findUnique({
      where: { id },
      include: {
        guests: true,
      },
    });

    if (!isTourBookingExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'TourBooking Not Found');
    }

    return isTourBookingExists;
  }

  async update(id: string, data: CreateTourBookingDto) {
    const { guests, ...tourBookingData } = data;

    const result = await this.prisma.$transaction(async (tx) => {
      const tourBookingUpdate = await tx.tourBooking.update({
        where: { id },
        data: { ...tourBookingData },
      });

      if (!tourBookingUpdate) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'TourBooking update failed');
      }

      await tx.guest.deleteMany({
        where: { tourBookingId: id },
      });

      if (guests && Array.isArray(guests) && guests.length > 0) {
        const guestCreation = await Promise.all(
          guests.map((guest) =>
            tx.guest.create({
              data: {
                ...guest,
                tourBookingId: id,
              },
            }),
          ),
        );

        if (!guestCreation) {
          throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Guest re-creation failed',
          );
        }
      }

      return tourBookingUpdate;
    });

    return result;
  }

  async remove(id: string) {
    const isTourBookingExists = await this.prisma.tourBooking.findUnique({
      where: { id },
    });

    if (!isTourBookingExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'TourBooking Not Found');
    }

    await this.prisma.guest.deleteMany({
      where: { tourBookingId: isTourBookingExists?.id },
    });

    return await this.prisma.tourBooking.delete({
      where: { id },
    });
  }

  async pay(id: string) {
    const isTourBookingExists = await this.prisma.tourBooking.findUnique({
      where: { id },
    });

    if (!isTourBookingExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'TourBooking Not Found');
    }

    const isTourPackageExists = await this.prisma.tourPackage.findUnique({
      where: { id: isTourBookingExists.tourPackageId },
    });

    if (!isTourPackageExists) {
      throw new ApiError(
        HttpStatus.NOT_FOUND,
        'TourPackage Not Found for this TourBooking',
      );
    }

    const createPaymentIntent = await this.stripe.createPaymentIntent({
      amount: isTourPackageExists?.price,
      currency: Currency.USD,
      metadata: {
        tourBookingId: id,
      },
    });

    if (!createPaymentIntent) {
      throw new ApiError(
        HttpStatus.BAD_REQUEST,
        'TourBooking payment intent creation failed',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const transactionCreation = await tx.transaction.create({
        data: {
          amount: createPaymentIntent.amount,
          currency: Currency.USD,
          paymentMethodId: createPaymentIntent.id,
          status: PaymentStatus.REQUIRES_PAYMENT_METHOD,
          tourBookingId: isTourBookingExists?.id,
          customerId: isTourBookingExists?.customerId,
        },
      });

      await tx.tourBooking.update({
        where: { id },
        data: { isPaid: true },
      });

      return transactionCreation;
    });

    return await this.prisma.tourBooking.findUnique({
      where: { id: result.tourBookingId },
      include: {
        guests: true,
        transactions: true,
      },
    });
  }

  async cancel(id: string, reason: string) {
    const isTourBookingExists = await this.prisma.tourBooking.findUnique({
      where: { id },
    });

    if (!isTourBookingExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'TourBooking Not Found');
    }

    if (isTourBookingExists.isCancelled) {
      throw new ApiError(
        HttpStatus.BAD_REQUEST,
        'TourBooking already cancelled',
      );
    }

    return await this.prisma.tourBooking.update({
      where: { id },
      data: { isCancelled: true, cancelReason: reason },
    });
  }
}
