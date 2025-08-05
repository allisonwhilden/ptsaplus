'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PaymentConfirmation from '@/components/payments/PaymentConfirmation';
import { loadStripe } from '@stripe/stripe-js';

// Force dynamic rendering to prevent build-time prerendering
// This page uses browser-only APIs (Stripe, useSearchParams)
export const dynamic = 'force-dynamic';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'success' | 'failed' | 'processing'>('processing');
  const [paymentDetails, setPaymentDetails] = useState<{
    amount?: number;
    paymentIntentId?: string;
    errorMessage?: string;
  }>({});

  useEffect(() => {
    const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
    const paymentIntent = searchParams.get('payment_intent');
    
    if (!paymentIntentClientSecret || !paymentIntent) {
      setStatus('failed');
      setPaymentDetails({
        errorMessage: 'Missing payment information. Please try again.',
      });
      return;
    }

    // Verify payment status with Stripe
    const verifyPayment = async () => {
      try {
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
        if (!stripe) {
          throw new Error('Failed to load Stripe');
        }

        const { paymentIntent: confirmedIntent } = await stripe.retrievePaymentIntent(
          paymentIntentClientSecret
        );

        if (!confirmedIntent) {
          throw new Error('Payment intent not found');
        }

        if (confirmedIntent.status === 'succeeded') {
          setStatus('success');
          setPaymentDetails({
            amount: confirmedIntent.amount,
            paymentIntentId: confirmedIntent.id,
          });
        } else {
          setStatus('failed');
          setPaymentDetails({
            errorMessage: 'Payment was not completed successfully.',
            paymentIntentId: confirmedIntent.id,
          });
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setStatus('failed');
        setPaymentDetails({
          errorMessage: 'Unable to verify payment status. Please check your email for confirmation.',
        });
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="container max-w-4xl py-8">
      <PaymentConfirmation
        status={status}
        amount={paymentDetails.amount}
        errorMessage={paymentDetails.errorMessage}
        paymentIntentId={paymentDetails.paymentIntentId}
      />
    </div>
  );
}