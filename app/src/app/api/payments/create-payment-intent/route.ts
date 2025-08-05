import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createPaymentIntent } from '@/lib/stripe/server';
import { createSecureErrorResponse } from '@/lib/stripe/errors';
import { logPaymentIntentCreated } from '@/lib/stripe/audit';
import { withRateLimit } from '@/lib/stripe/rate-limit';
import { createClient } from '@supabase/supabase-js';
import type { PaymentIntentResponse } from '@/lib/stripe/types';

// Initialize Supabase client with service role for payment operations
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

export async function POST(request: NextRequest) {
  // Authenticate user first
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Apply rate limiting with userId
  return withRateLimit(request, async () => {
    try {
      // Verify HTTPS in production
      if (process.env.NODE_ENV === 'production') {
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        if (protocol !== 'https') {
          return NextResponse.json(
            { error: 'HTTPS required' },
            { status: 403 }
          );
        }
      }

    // Get user email from Clerk
    const user = await auth().then(async (auth) => {
      if (!auth.userId) return null;
      // In a real implementation, you would fetch the user's email from Clerk
      // For now, we'll use a placeholder
      return { email: `user-${auth.userId}@example.com` };
    });

    if (!user?.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { amount, paymentType, metadata = {} } = body;

    // Create payment intent with validated parameters
    const paymentIntent = await createPaymentIntent({
      amount,
      userId,
      userEmail: user.email,
      paymentType,
      metadata,
    });

    // Store payment record in database
    const { error: dbError } = await supabaseAdmin.from('payments').insert({
      user_id: userId,
      stripe_payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount,
      status: 'pending',
      type: paymentType,
      metadata: {
        ...metadata,
        stripe_customer_id: paymentIntent.customer,
      },
    });

    if (dbError) {
      console.error('Failed to store payment record:', dbError);
      // Don't fail the payment, but log for monitoring
    }

    // Log payment intent creation
    logPaymentIntentCreated(
      userId,
      paymentIntent.amount,
      paymentIntent.id,
      paymentType
    );

    // Return client secret for Stripe Elements
    const response: PaymentIntentResponse = {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    };

      return NextResponse.json(response);
    } catch (error) {
      const { response, statusCode } = createSecureErrorResponse(error);
      return NextResponse.json(response, { status: statusCode });
    }
  }, userId);
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}