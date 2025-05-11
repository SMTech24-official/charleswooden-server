// import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
// import { PrismaService } from '@/helper/prisma.service';
// import { ConfigService } from '@nestjs/config';
// import Stripe from 'stripe';
// import { BrevoService } from '@/email/brevo';
// import { PaymentStatus } from '@prisma/client';

// @Injectable()
// export class SubscriptionService {
//   private stripe: Stripe;

//   constructor(
//     private readonly prisma: PrismaService,
//     private readonly configService: ConfigService,
//     private readonly mailService: BrevoService,
//   ) {
//     this.stripe = new Stripe(this.configService.get<string>('STRIPE_SK'), {
//       apiVersion: '2025-04-30.basil',
//     });
//   }

//   async formatStripeExpirationDate(
//     expirationTimestamp: number,
//   ): Promise<string> {
//     const expirationDate = new Date(expirationTimestamp * 1000);

//     const options: Intl.DateTimeFormatOptions = {
//       weekday: 'long',
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit',
//       second: '2-digit',
//       hour12: true,
//     };

//     return expirationDate.toLocaleString('en-US', options);
//   }

//   async handleCustomerSubscription(subscription: Stripe.Subscription) {
//     const metadata = subscription.metadata as {
//       customerId: string;
//       subscriptionPlanId: string;
//     };

//     if (
//       !metadata.customerId ||
//       !metadata.subscriptionPlanId ||
//       !subscription.id
//     ) {
//       throw new HttpException(
//         'Missing subscription metadata',
//         HttpStatus.BAD_REQUEST,
//       );
//     }

//     const customer = await this.prisma.customer.findUnique({
//       where: { id: metadata.customerId },
//     });

//     if (!customer) {
//       throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
//     }

//     const plan = await this.prisma.subscriptionPlan.findUnique({
//       where: { id: metadata.subscriptionPlanId },
//     });

//     if (!plan) {
//       throw new HttpException(
//         'Subscription plan not found',
//         HttpStatus.NOT_FOUND,
//       );
//     }

//     try {
//       const existingSubscription = await this.prisma.subscription.findFirst({
//         where: { customerId: metadata.customerId },
//       });

//       return this.prisma.$transaction(async (tx) => {
//         if (existingSubscription) {
//           await tx.subscription.update({
//             where: { id: existingSubscription.id },
//             data: {
//               expiresAt: new Date(subscription.current_period_end * 1000),
//               subscriptionStatus: 'ACTIVE',
//               stripeSubscriptionId: subscription.id,
//               subscriptionPlanId: plan.id,
//               stripeCustomerId: subscription.customer as string,
//             },
//           });
//         } else {
//           await tx.subscription.create({
//             data: {
//               customerId: customer.id,
//               subscriptionPlanId: plan.id,
//               expiresAt: new Date(subscription.current_period_end * 1000),
//               stripeSubscriptionId: subscription.id,
//               subscriptionStatus: 'ACTIVE',
//               stripeCustomerId: subscription.customer as string,
//             },
//           });
//         }

//         await tx.customer.update({
//           where: { id: customer.id },
//           data: { planName: plan.planName },
//         });

//         // Create notifications
//         await tx.notification.createMany({
//           data: [
//             {
//               userId: customer.userId,
//               type: 'SUBSCRIPTION_REMINDER',
//               message: `New Customer subscribed: ${customer.firstName} ${customer.lastName}`,
//               notiFicationRole: 'ADMIN',
//             },
//             {
//               userId: customer.userId,
//               type: 'SUBSCRIPTION_REMINDER',
//               message: `Welcome ${customer.firstName} ${customer.lastName}! You've successfully joined`,
//               notiFicationRole: 'Customer',
//             },
//           ],
//         });
//       });
//     } catch (error) {
//       throw new HttpException(
//         'Error creating subscription',
//         HttpStatus.INTERNAL_SERVER_ERROR,
//       );
//     }
//   }

//   async handleCustomerPayment(invoice: Stripe.Invoice) {
//     const subscriptionId = invoice.subscription as string;
//     const stripeSubscription =
//       await this.stripe.subscriptions.retrieve(subscriptionId);

//     const metadata = stripeSubscription.metadata as {
//       customerId: string;
//       subscriptionPlanId: string;
//     };

//     if (!metadata.customerId || !metadata.subscriptionPlanId) {
//       throw new HttpException(
//         'Invalid payment metadata',
//         HttpStatus.BAD_REQUEST,
//       );
//     }

//     const existingSubscription = await this.prisma.subscription.findFirst({
//       where: { customerId: metadata.customerId },
//     });

//     if (!existingSubscription) {
//       throw new HttpException('Subscription not found', HttpStatus.NOT_FOUND);
//     }

//     return this.prisma.$transaction(async (tx) => {
//       await tx.subscription.update({
//         where: { id: existingSubscription.id },
//         data: {
//           subscriptionStatus: 'ACTIVE',
//           stripeSubscriptionId: subscriptionId,
//         },
//       });

//       if (invoice.amount_paid > 0) {
//         await tx.payment.create({
//           data: {
//             customerId: metadata.customerId,
//             amount: invoice.amount_paid / 100,
//             currency: invoice.currency,
//             paymentDate: new Date(invoice.created * 1000),
//             subscriptionId: existingSubscription.id,
//             paymentStatus: PaymentStatus.SUCCEEDED,
//             subscriptionPlanId: existingSubscription.subscriptionPlanId,
//           },
//         });
//       }

//       await tx.customer.update({
//         where: { id: metadata.CustomerId },
//         data: { subscriptionStatus: 'ACTIVE' },
//       });
//     });
//   }

//   async handleSubscriptionCancellation(subscription: Stripe.Subscription) {
//     const metadata = subscription.metadata as {
//       customerId: string;
//       subscriptionPlanId: string;
//     };

//     if (!metadata.customerId) {
//       throw new HttpException(
//         'Invalid cancellation request',
//         HttpStatus.BAD_REQUEST,
//       );
//     }

//     const existingSubscription = await this.prisma.subscription.findFirst({
//       where: {
//         stripeSubscriptionId: subscription.id,
//         customerId: metadata.customerId,
//       },
//     });

//     if (
//       !existingSubscription ||
//       existingSubscription.subscriptionStatus === 'EXPIRED'
//     ) {
//       return true;
//     }

//     return this.prisma.$transaction(async (tx) => {
//       await tx.subscription.update({
//         where: { id: existingSubscription.id },
//         data: { subscriptionStatus: 'CANCELLED' },
//       });

//       await tx.customer.update({
//         where: { id: metadata.customerId },
//         data: { subscriptionStatus: 'EXPIRED', planName: 'FREE' },
//       });
//     });
//   }

//   async handleFailedPayment(invoice: Stripe.Invoice) {
//     const subscriptionId = invoice.subscription as string;
//     const stripeSubscription =
//       await this.stripe.subscriptions.retrieve(subscriptionId);
//     const metadata = stripeSubscription.metadata as {
//       CustomerId: string;
//       subscriptionPlanId: string;
//     };

//     const amountDue = invoice.amount_due / 100;
//     const currency = invoice.currency.toUpperCase();

//     if (!metadata.CustomerId || !metadata.subscriptionPlanId) {
//       throw new HttpException(
//         'Missing payment metadata',
//         HttpStatus.BAD_REQUEST,
//       );
//     }

//     const customer = await this.prisma.customer.findUnique({
//       where: { id: metadata.CustomerId },
//     });

//     if (!customer) {
//       throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
//     }

//     const subscription = await this.prisma.subscription.findFirst({
//       where: {
//         stripeSubscriptionId: subscriptionId,
//         customerId: metadata.CustomerId,
//         subscriptionPlanId: metadata.subscriptionPlanId,
//       },
//     });

//     if (!subscription) {
//       throw new HttpException('Subscription not found', HttpStatus.NOT_FOUND);
//     }

//     const failedCount =
//       parseInt(stripeSubscription.metadata.failedPayments || '1') + 1;

//     return this.prisma.$transaction(async (tx) => {
//       await tx.subscription.update({
//         where: { id: subscription.id },
//         data: { subscriptionStatus: 'PAST_DUE' },
//       });

//       if (customer.subscriptionStatus === 'ACTIVE') {
//         await tx.customer.update({
//           where: { id: metadata.CustomerId },
//           data: { subscriptionStatus: 'EXPIRED', planName: 'FREE' },
//         });
//       }

//       const user = await this.prisma.user.findUnique({
//         where: { id: customer.userId },
//       });

//       await tx.payment.create({
//         data: {
//           customerId: metadata.CustomerId,
//           amount: amountDue,
//           currency,
//           paymentDate: new Date(),
//           subscriptionId: subscription.id,
//           paymentStatus: 'FAILED',
//           subscriptionPlanId: subscription.subscriptionPlanId,
//         },
//       });

//       // Send first failed payment email
//       await this.mailService.sendEmail({
//         sender: {
//           name: this.configService.get('SENDER_NAME'),
//           email: this.configService.get('SENDER_EMAIL'),
//         },
//         to: [
//           {
//             name: user.username,
//             email: user.email,
//           },
//         ],
//         subject: '🚨 Payment Failed for Your Subscription',
//         htmlContent: `
//           <p>Hello ${customer.firstName},</p>
//           <p>Your payment of ${amountDue} ${currency} has failed. 
//           Please update your payment method to avoid cancellation.</p>
//           <p><a href="${this.configService.get('FRONTEND_URL')}/update-payment">Update Payment</a></p>
//         `,
//       });

//       if (failedCount >= 3) {
//         await this.stripe.subscriptions.update(subscriptionId, {
//           cancel_at_period_end: false,
//         });
//         await this.stripe.subscriptions.cancel(subscriptionId);

//         await tx.subscription.update({
//           where: { id: subscription.id },
//           data: { subscriptionStatus: 'CANCELLED' },
//         });

//         await this.mailService.sendEmail({
//           sender: {
//             name: this.configService.get('SENDER_NAME'),
//             email: this.configService.get('SENDER_EMAIL'),
//           },
//           to: [
//             {
//               name: user.username,
//               email: user.email,
//             },
//           ],
//           subject: '🚫 Subscription Cancelled Due to Payment Failure',
//           htmlContent: `
//             <p>Hello ${customer.firstName},</p>
//             <p>Your subscription has been cancelled due to repeated failed payments.</p>
//             <p>You can resubscribe anytime by updating your payment details.</p>
//           `,
//         });
//       } else {
//         await this.stripe.subscriptions.update(subscriptionId, {
//           metadata: { failedPayments: failedCount.toString() },
//         });
//       }
//     });
//   }

//   async handleSubscriptionRenewal(subscription: Stripe.Subscription) {
//     const metadata = subscription.metadata as {
//       CustomerId: string;
//       subscriptionPlanId: string;
//     };

//     if (!metadata.CustomerId || !metadata.subscriptionPlanId) {
//       throw new HttpException(
//         'Missing subscription metadata',
//         HttpStatus.BAD_REQUEST,
//       );
//     }

//     const existingSubscription = await this.prisma.subscription.findFirst({
//       where: {
//         stripeSubscriptionId: subscription.id,
//         customerId: metadata.CustomerId,
//       },
//     });

//     const plan = await this.prisma.subscriptionPlan.findUnique({
//       where: { id: metadata.subscriptionPlanId },
//     });

//     if (!existingSubscription || !plan) {
//       throw new HttpException(
//         'Subscription or plan not found',
//         HttpStatus.NOT_FOUND,
//       );
//     }

//     if (subscription.cancel_at_period_end) {
//       return this.prisma.subscription.update({
//         where: { id: existingSubscription.id },
//         data: { cancelRequest: true },
//       });
//     }

//     return this.prisma.$transaction(async (tx) => {
//       await tx.subscription.update({
//         where: { id: existingSubscription.id },
//         data: {
//           expiresAt: new Date(subscription.current_period_end * 1000),
//           subscriptionStatus: 'ACTIVE',
//           subscriptionPlanId: plan.id,
//           cancelRequest: false,
//         },
//       });

//       await tx.customer.update({
//         where: { id: metadata.CustomerId },
//         data: {
//           subscriptionStatus: 'ACTIVE',
//           planName: plan.planName,
//         },
//       });
//     });
//   }

//   async sendExpiryReminder(subscription: Stripe.Subscription) {
//     const metadata = subscription.metadata as {
//       customerId: string;
//       subscriptionPlanId: string;
//     };

//     const customer = await this.prisma.customer.findUnique({
//       where: { id: metadata.customerId },
//     });

//     if (!customer) {
//       throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
//     }

//     const user = await this.prisma.user.findUnique({
//       where: { id: customer.userId },
//     });

//     const expiryDate = this.formatStripeExpirationDate(
//       subscription.current_period_end,
//     );

//     await this.mailService.sendEmail({
//       sender: {
//         name: this.configService.get('SENDER_NAME'),
//         email: this.configService.get('SENDER_EMAIL'),
//       },
//       to: [
//         {
//           name: user.username,
//           email: user.email,
//         },
//       ],
//       subject: 'Your link cohort subscription is about to expire!',
//       htmlContent: `<p>Hello ${customer.firstName}, your link cohort subscription expires on ${expiryDate}. Renew now to avoid service interruption.</p>`,
//     });
//   }
// }
