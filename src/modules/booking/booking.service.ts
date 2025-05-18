import { PrismaService } from '@/helper/prisma.service';
import { IGenericResponse } from '@/interface/common';
import { ApiError } from '@/utils/api_error';
import QueryBuilder from '@/utils/query_builder';
import { HttpStatus, Injectable, RawBodyRequest } from '@nestjs/common';
import { Booking, Prisma } from '@prisma/client';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Request } from 'express';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BookingService {
  constructor(
    private stripe: Stripe,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SK'), {
      apiVersion: '2025-04-30.basil',
    });
  }

  async create(payload: CreateBookingDto, req: Request) {
    const user = req.user as any;

    const { paymentMethodId, ...data } = payload;
    const customer = await this.prisma.customer.findUnique({
      where: { userId: user.id },
      include: { user: true },
    });

    const isEventExist = await this.prisma.event.findUnique({
      where: { id: payload.eventId },
    });

    if (!isEventExist)
      throw new ApiError(HttpStatus.NOT_FOUND, 'event does not exist');
    if (!customer)
      throw new ApiError(
        HttpStatus.UNAUTHORIZED,
        'customer not found with this email:',
        user.email,
      );

    const isSubscriptionActive = await this.prisma.subscription.findFirst({
      where: {
        customerId: customer.id,
        subscriptionStatus: 'ACTIVE',
      },
    });

    if (!isSubscriptionActive && !paymentMethodId)
      throw new ApiError(
        HttpStatus.BAD_REQUEST,
        'you do not have any active subscription please subscribe or pay for this event entry fee ',
      );

    const bookingData = {
      customerId: payload.customerId,
      eventId: payload.eventId,
      paymentSource: isSubscriptionActive ? 'SUBSCRIPTION' : 'SINGLE',
      status: isSubscriptionActive ? 'ACTIVE' : 'PENDING',
    };

    let paymentIntent: Stripe.PaymentIntent | null = null; // Define outside the transaction for rollback

    try {
      if (!isSubscriptionActive) {
        const createdBooking = await this.prisma.booking.create({
          data: {
            ...(bookingData as any),
          },
        });
        // Start Transaction
        const transactionResult = await this.prisma.$transaction(async (TX) => {
          paymentIntent = await this.stripe.paymentIntents.create({
            amount: Number((isEventExist.entryFee * 100).toFixed(5)), // Convert to cents
            currency: 'usd',
            payment_method: paymentMethodId,
            // confirm: true, // Auto-confirm the payment
            automatic_payment_methods: {
              enabled: true,
              allow_redirects: 'never', // Prevent Stripe from requiring a `return_url`
            },
            metadata: { bookingId: createdBooking.id },
            shipping: {
              name: customer.partnerOneName,
              phone: (customer?.user.contactNo as string) || '',
              address: {
                line1: customer.address,
                city: customer.location,
              },
            },
          });
          const paymentData = {
            amount: isEventExist.entryFee,
            currency: 'usd',
            paymentStatus: 'PROCESSING',
            paymentSource: 'SINGLE',
            bookingId: createdBooking?.id,
            paymentDate: new Date(),
          };
          const payment = await TX.payment.create({
            data: paymentData as any,
          });

          const confirmPayment = await this.stripe.paymentIntents.confirm(
            paymentIntent.id,
          );
          // console.log({paymentConfirm})
          console.log(
            '✅✅✅ congrates payment and booking intiated created successfully',
          );
          return bookingData;
        });

        return createdBooking;
      } else {
        const createdBooking = await this.prisma.booking.create({
          data: {
            ...(bookingData as any),
          },
        });

        return createdBooking;
      }
    } catch (error: any) {
      console.error('❌ Transaction Failed:', error.message as string);
      // 🛑 If the Stripe PaymentIntent was created but transaction failed, cancel it

      // @ts-ignore
      if (paymentIntent && typeof paymentIntent?.id === 'string') {
        console.log(paymentIntent, '☑️errro ');
        try {
          console.log('🛑 Rolling back PaymentIntent in Stripe...');
          // @ts-ignore
          await stripe.paymentIntents.cancel(paymentIntent.id);
        } catch (stripeError) {
          console.error('⚠️ Failed to cancel PaymentIntent:', stripeError);
        }
      }

      throw new ApiError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Transaction failed. PaymentIntent has been rolled back.',
      );
    }
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
    // ✅ Handle Payment Success Event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('✅ Payment Intent Succeeded:');

      // Extract orderId from metadata
      const bookingId = paymentIntent.metadata?.bookingId;
      if (!bookingId) {
        console.error('🚨 Order ID missing in metadata!');
        throw new ApiError(
          HttpStatus.NOT_FOUND,
          'Order ID missing in metadata.',
        );
      }

      console.log('🔹 Updating Order & Payment for Order ID:', bookingId);

      try {
        // ✅ Update Order & Payment Status in DB
        await this.prisma.$transaction(async (tx) => {
          // Update Payment Record
          await tx.payment.update({
            where: { bookingId: bookingId },
            data: {
              paymentStatus: 'SUCCEEDED',
            },
          });

          // Update Order Status to 'PROCESSING' or 'SHIPPED' based on your business logic
          const updatedOrder = await tx.booking.update({
            where: { id: bookingId },
            data: { status: 'ACTIVE' },
          });

          // console.log({updatedOrderData:updatedOrderProducts,updatedOrder})
        });
      } catch (error) {
        console.error('⚠️ Error updating payment and order status:', error);
        throw new ApiError(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'Error occurred while updating payment and order status',
        );
      }
    }

    // ✅ Handle Payment Failure Event
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('❌ Payment Intent Failed:', paymentIntent);

      // Extract orderId from metadata
      const bookingId = paymentIntent.metadata?.bookingId;
      if (bookingId) {
        try {
          await this.prisma.$transaction(async (tx) => {
            // Update Payment Record
            await this.prisma.booking.update({
              where: { id: bookingId },
              data: { status: 'CANCELLED' },
            });

            await tx.payment.update({
              where: { bookingId: bookingId },
              data: {
                paymentStatus: 'SUCCEEDED',
              },
            });

            // console.log({updatedOrderData:updatedOrderProducts,updatedOrder})
          });
        } catch (error) {
          console.error('⚠️ Error updating order on payment failure:', error);
          throw new ApiError(
            HttpStatus.INTERNAL_SERVER_ERROR,
            'Error updating order on payment failure',
          );
        }
      }
    }

    // ✅ Successfully processed the webhook
    console.log('✅ Order & Payment Updated Successfully.');
    console.log('ℹ️ Webhook Processed Successfully.');

    // Respond with 200 to acknowledge receipt of the event
    return { success: true };
  }
}
