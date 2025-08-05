import Stripe from 'stripe';
import { validatePaymentParams } from './validation';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
  typescript: true,
});

export interface CreatePaymentIntentParams {
  amount: number;
  userId: string;
  userEmail: string;
  paymentType: 'membership' | 'donation';
  metadata?: Record<string, string>;
}

export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<Stripe.PaymentIntent> {
  // Validate all parameters before processing
  const validatedParams = validatePaymentParams(params);
  const { amount, userId, userEmail, paymentType, metadata = {} } = validatedParams;
  
  // Generate idempotency key to prevent duplicate charges
  const idempotencyKey = `pi_${userId}_${amount}_${paymentType}_${Date.now()}`;
  
  return await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      userId,
      userEmail,
      paymentType,
      ...metadata,
    },
  }, {
    idempotencyKey,
  });
}

export async function constructWebhookEvent(
  body: string | Buffer,
  signature: string,
  webhookSecret: string,
): Promise<Stripe.Event> {
  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}

export async function retrievePaymentIntent(
  paymentIntentId: string,
): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.retrieve(paymentIntentId);
}