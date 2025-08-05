import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { constructWebhookEvent } from '@/lib/stripe/server';
import { createClient } from '@supabase/supabase-js';
import { 
  logPaymentSucceeded, 
  logPaymentFailed, 
  logWebhookReceived, 
  logWebhookFailed 
} from '@/lib/stripe/audit';
import type Stripe from 'stripe';

// Initialize Supabase client with service role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Stripe requires the raw body to verify webhook signatures
export const runtime = 'nodejs';

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { userId } = paymentIntent.metadata;
  
  try {
    // Update payment record in database
    const { error } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'succeeded',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (error) {
      console.error('Failed to update payment status:', error);
      throw error;
    }

    // Log audit event
    await supabaseAdmin.from('payment_audit_logs').insert({
      payment_id: paymentIntent.id,
      event_type: 'payment.succeeded',
      event_data: {
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        payment_method: paymentIntent.payment_method_types[0],
      },
    });

    // Log success
    logPaymentSucceeded(userId, paymentIntent.amount, paymentIntent.id);
    
    // TODO: Send confirmation email
    // TODO: Update member status if membership payment
    
  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { userId } = paymentIntent.metadata;
  
  try {
    // Update payment record
    const { error } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (error) {
      console.error('Failed to update payment status:', error);
    }

    // Log audit event
    await supabaseAdmin.from('payment_audit_logs').insert({
      payment_id: paymentIntent.id,
      event_type: 'payment.failed',
      event_data: {
        amount: paymentIntent.amount,
        error: paymentIntent.last_payment_error?.message,
      },
    });

    // Log failure
    logPaymentFailed(
      userId, 
      paymentIntent.amount, 
      paymentIntent.id,
      paymentIntent.last_payment_error?.message
    );
    
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  // Verify signature is present
  if (!signature) {
    logWebhookFailed('Missing stripe-signature header');
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  // Verify webhook secret is configured
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    logWebhookFailed('Missing STRIPE_WEBHOOK_SECRET environment variable');
    throw new Error('Missing STRIPE_WEBHOOK_SECRET');
  }

  try {
    // Construct and verify the webhook event
    const event = await constructWebhookEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Log webhook received
    logWebhookReceived(event.type, event.id);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.canceled':
        const canceledIntent = event.data.object as Stripe.PaymentIntent;
        await supabaseAdmin
          .from('payments')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', canceledIntent.id);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const error = err as Error;
    logWebhookFailed(error.message, signature);
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}