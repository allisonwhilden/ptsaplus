import { Stripe } from 'stripe';

export interface PaymentErrorResponse {
  error: string;
  code?: string;
  type?: string;
}

export function createSecureErrorResponse(error: unknown): {
  response: PaymentErrorResponse;
  statusCode: number;
} {
  // Log full error for debugging (but not to the user)
  console.error('Payment error:', error);
  
  // Handle Stripe-specific errors
  if (error instanceof Stripe.errors.StripeError) {
    // Card errors are safe to show to users
    if (error instanceof Stripe.errors.StripeCardError) {
      return {
        response: {
          error: error.message,
          code: error.code,
          type: 'card_error',
        },
        statusCode: 400,
      };
    }
    
    // Invalid request errors (e.g., missing parameters)
    if (error instanceof Stripe.errors.StripeInvalidRequestError) {
      return {
        response: {
          error: 'Invalid payment request. Please try again.',
          type: 'invalid_request',
        },
        statusCode: 400,
      };
    }
    
    // Rate limit errors
    if (error instanceof Stripe.errors.StripeRateLimitError) {
      return {
        response: {
          error: 'Too many requests. Please try again later.',
          type: 'rate_limit',
        },
        statusCode: 429,
      };
    }
    
    // Authentication errors
    if (error instanceof Stripe.errors.StripeAuthenticationError) {
      return {
        response: {
          error: 'Payment service configuration error. Please contact support.',
          type: 'configuration_error',
        },
        statusCode: 500,
      };
    }
  }
  
  // Handle validation errors
  if (error instanceof Error && error.name === 'PaymentValidationError') {
    return {
      response: {
        error: error.message,
        type: 'validation_error',
      },
      statusCode: 400,
    };
  }
  
  // Generic error response for all other cases
  return {
    response: {
      error: 'Payment processing failed. Please try again.',
      type: 'server_error',
    },
    statusCode: 500,
  };
}

export async function retryPaymentOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on validation errors or card errors
      if (
        error instanceof Error &&
        (error.name === 'PaymentValidationError' ||
          error instanceof Stripe.errors.StripeCardError)
      ) {
        throw error;
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.log(`Retrying payment operation (attempt ${attempt + 2}/${maxRetries})`);
    }
  }
  
  throw lastError;
}