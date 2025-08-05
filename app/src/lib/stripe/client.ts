import { loadStripe } from '@stripe/stripe-js';

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable');
}

export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export const STRIPE_PAYMENT_AMOUNTS = {
  MEMBERSHIP_BASE: 1500, // $15.00 in cents
  MEMBERSHIP_PLUS: 2500, // $25.00 in cents
  MEMBERSHIP_PREMIUM: 5000, // $50.00 in cents
};

export const formatAmountForDisplay = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount / 100);
};

export const formatAmountForStripe = (amount: number): number => {
  return Math.round(amount * 100);
};