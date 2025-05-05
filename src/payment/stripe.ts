import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY'),
      {
        apiVersion: '2025-04-30.basil', // Use the latest API version
      },
    );
  }

  async createPaymentIntent({
    amount,
    currency,
    metadata,
  }: {
    amount: number;
    currency: string;
    metadata: any;
  }) {
    return await this.stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: currency,
      payment_method_types: ['card'],
      metadata,
    });
  }

  async createCharge(data: Stripe.ChargeCreateParams) {
    return await this.stripe.charges.create(data);
  }

  async retrieveCharge(id: string) {
    return await this.stripe.charges.retrieve(id);
  }

  async handleWebhook(payload: string, sig: string): Promise<Stripe.Event> {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    return this.stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  }
}
