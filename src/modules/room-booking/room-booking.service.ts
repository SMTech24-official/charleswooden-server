import { PrismaService } from '@/helper/prisma.service';
import { IGenericResponse } from '@/interface/common';
import { ApiError } from '@/utils/api_error';
import QueryBuilder from '@/utils/query_builder';
import { HttpStatus, Injectable } from '@nestjs/common';
import { RoomBooking, Guest, Currency, PaymentStatus } from '@prisma/client';
import { CreateRoomBookingDto } from './dto/create-room-booking.dto';
import { StripeService } from '@/payment/stripe';

@Injectable()
export class RoomBookingService {
  constructor(
    private prisma: PrismaService,
    private stripe: StripeService,
  ) {}

  async create(data: CreateRoomBookingDto) {
    const { guests, ...roomBookingData } = data;

    const result = await this.prisma.$transaction(async (tx) => {
      const RoomBookingCreation = await this.prisma.roomBooking.create({
        data: { ...roomBookingData },
      });

      if (!RoomBookingCreation) {
        throw new ApiError(
          HttpStatus.BAD_REQUEST,
          'RoomBooking creation failed',
        );
      }

      if (guests && Array.isArray(guests) && guests.length > 0) {
        const guestCreation = await Promise.all(
          guests.map(async (guest: Guest) => {
            return await tx.guest.create({
              data: {
                ...guest,
                roomBookingId: RoomBookingCreation.id,
              },
            });
          }),
        );

        const guestCreationResult = await Promise.all(guestCreation);

        if (!guestCreationResult) {
          throw new ApiError(HttpStatus.BAD_REQUEST, 'Guest creation failed');
        }
      }

      return RoomBookingCreation;
    });

    return await this.prisma.roomBooking.findUnique({
      where: { id: result.id },
      include: {
        guests: true,
      },
    });
  }

  async findAll(
    query: Record<string, any>,
  ): Promise<IGenericResponse<RoomBooking[]>> {
    const populateFields = query.populate
      ? query.populate
          .split(',')
          .reduce((acc: Record<string, boolean>, field) => {
            acc[field] = true;
            return acc;
          }, {})
      : {};

    const queryBuilder = new QueryBuilder(this.prisma.roomBooking, query);
    const RoomBookings = await queryBuilder
      .range()
      .search([])
      .filter(['title', 'slug'], [])
      .sort()
      .paginate()
      .fields()
      .populate(populateFields)
      .include({
        guests: true,
      })
      .execute();

    const meta = await queryBuilder.countTotal();

    return { meta, data: RoomBookings };
  }

  async findOne(id: string) {
    const isRoomBookingExists = await this.prisma.roomBooking.findUnique({
      where: { id },
      include: {
        guests: true,
      },
    });

    if (!isRoomBookingExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'RoomBooking Not Found');
    }

    return isRoomBookingExists;
  }

  async update(id: string, data: CreateRoomBookingDto) {
    const { guests, ...RoomBookingData } = data;

    const result = await this.prisma.$transaction(async (tx) => {
      const RoomBookingUpdate = await tx.roomBooking.update({
        where: { id },
        data: { ...RoomBookingData },
      });

      if (!RoomBookingUpdate) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'RoomBooking update failed');
      }

      await tx.guest.deleteMany({
        where: { roomBookingId: id },
      });

      if (guests && Array.isArray(guests) && guests.length > 0) {
        const guestCreation = await Promise.all(
          guests.map((guest) =>
            tx.guest.create({
              data: {
                ...guest,
                roomBookingId: id,
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

      return RoomBookingUpdate;
    });

    return await this.prisma.roomBooking.findUnique({
      where: { id: result?.id },
      include: { guests: true },
    });
  }

  async remove(id: string) {
    const isRoomBookingExists = await this.prisma.roomBooking.findUnique({
      where: { id },
    });

    if (!isRoomBookingExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'RoomBooking Not Found');
    }

    await this.prisma.guest.deleteMany({
      where: { roomBookingId: isRoomBookingExists?.id },
    });

    return await this.prisma.roomBooking.delete({
      where: { id },
      include: { guests: true },
    });
  }

  async pay(id: string) {
    const isRoomBookingExists = await this.prisma.roomBooking.findUnique({
      where: { id },
    });

    if (!isRoomBookingExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'RoomBooking Not Found');
    }

    const isTourPackageExists = await this.prisma.tourPackage.findUnique({
      where: { id: isRoomBookingExists.hotelPackageId },
    });

    if (!isTourPackageExists) {
      throw new ApiError(
        HttpStatus.NOT_FOUND,
        'TourPackage Not Found for this RoomBooking',
      );
    }

    const createPaymentIntent = await this.stripe.createPaymentIntent({
      amount: isTourPackageExists?.price,
      currency: Currency.USD,
      metadata: {
        RoomBookingId: id,
      },
    });

    if (!createPaymentIntent) {
      throw new ApiError(
        HttpStatus.BAD_REQUEST,
        'RoomBooking payment intent creation failed',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const transactionCreation = await tx.transaction.create({
        data: {
          amount: createPaymentIntent.amount,
          currency: Currency.USD,
          paymentMethodId: createPaymentIntent.id,
          status: PaymentStatus.REQUIRES_PAYMENT_METHOD,
          roomBookingId: isRoomBookingExists?.id,
          customerId: isRoomBookingExists?.customerId,
        },
      });

      await tx.roomBooking.update({
        where: { id },
        data: { isPaid: true },
      });

      return transactionCreation;
    });

    return await this.prisma.roomBooking.findUnique({
      where: { id: result.roomBookingId },
      include: {
        guests: true,
        transactions: true,
      },
    });
  }

  async cancel(id: string, reason: string) {
    const isRoomBookingExists = await this.prisma.roomBooking.findUnique({
      where: { id },
    });

    if (!isRoomBookingExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'RoomBooking Not Found');
    }

    if (isRoomBookingExists.isCancelled) {
      throw new ApiError(
        HttpStatus.BAD_REQUEST,
        'RoomBooking already cancelled',
      );
    }

    return await this.prisma.roomBooking.update({
      where: { id },
      data: { isCancelled: true, cancelReason: reason },
    });
  }
}
