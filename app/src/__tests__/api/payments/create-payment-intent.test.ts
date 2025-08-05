import { NextRequest } from 'next/server';
import { POST } from '@/app/api/payments/create-payment-intent/route';
import { PaymentValidationError } from '@/lib/stripe/validation';

// Mock dependencies
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/stripe/server', () => ({
  createPaymentIntent: jest.fn(),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({ error: null })),
    })),
  })),
}));

const mockAuth = jest.requireMock('@clerk/nextjs/server').auth;
const mockCreatePaymentIntent = jest.requireMock('@/lib/stripe/server').createPaymentIntent;
import { clearRateLimitStore } from '@/lib/stripe/rate-limit';

describe('POST /api/payments/create-payment-intent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearRateLimitStore();
  });
  
  afterEach(() => {
    clearRateLimitStore();
  });

  it('should create a payment intent successfully', async () => {
    // Mock authenticated user
    mockAuth.mockResolvedValue({ userId: 'user_123' });
    
    // Mock payment intent creation
    mockCreatePaymentIntent.mockResolvedValue({
      id: 'pi_test_123',
      client_secret: 'pi_test_123_secret',
      amount: 1500,
      customer: 'cus_123',
    });

    const request = new NextRequest('http://localhost/api/payments/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount: 1500,
        paymentType: 'membership',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      clientSecret: 'pi_test_123_secret',
      paymentIntentId: 'pi_test_123',
    });
    expect(mockCreatePaymentIntent).toHaveBeenCalledWith({
      amount: 1500,
      userId: 'user_123',
      userEmail: expect.any(String),
      paymentType: 'membership',
      metadata: {},
    });
  });

  it('should reject unauthenticated requests', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const request = new NextRequest('http://localhost/api/payments/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount: 1500,
        paymentType: 'membership',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Authentication required' });
  });

  it('should validate payment amount limits', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_123' });

    // Test amount too small
    mockCreatePaymentIntent.mockRejectedValue(new PaymentValidationError('Payment amount must be at least $1'));
    
    let request = new NextRequest('http://localhost/api/payments/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount: 50, // $0.50 - below minimum
        paymentType: 'membership',
      }),
    });

    let response = await POST(request);
    let data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain('Payment amount must be at least $1');

    // Test amount too large for membership
    mockCreatePaymentIntent.mockRejectedValue(new PaymentValidationError('Payment amount cannot exceed $100'));
    
    request = new NextRequest('http://localhost/api/payments/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount: 15000, // $150 - above membership limit
        paymentType: 'membership',
      }),
    });

    response = await POST(request);
    data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain('Payment amount cannot exceed $100');
  });

  it('should handle Stripe errors gracefully', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_123' });
    
    // Mock Stripe error
    const stripeError = new Error('Stripe API error');
    stripeError.name = 'StripeAPIError';
    mockCreatePaymentIntent.mockRejectedValue(stripeError);

    const request = new NextRequest('http://localhost/api/payments/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount: 1500,
        paymentType: 'membership',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Payment processing failed. Please try again.');
  });

  it('should apply rate limiting', async () => {
    // Use a unique user ID for this test to avoid rate limit conflicts
    const testUserId = `test_rate_limit_unique_${Date.now()}_${Math.random()}`;
    mockAuth.mockResolvedValue({ userId: testUserId });
    
    // Ensure rate limit store is cleared for this test
    clearRateLimitStore();
    
    // Mock successful payment intent creation for all requests
    mockCreatePaymentIntent.mockResolvedValue({
      id: 'pi_test_123',
      client_secret: 'pi_test_123_secret',
      amount: 1500,
      customer: 'cus_123',
    });
    
    // Make requests sequentially with the same user to test rate limiting
    let successCount = 0;
    let rateLimitedCount = 0;
    
    // Try to make 10 requests - we should get rate limited at some point
    for (let i = 0; i < 10; i++) {
      const request = new NextRequest('http://localhost/api/payments/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify({
          amount: 1500,
          paymentType: 'membership',
        }),
      });
      
      const response = await POST(request);
      if (response.status === 200) {
        successCount++;
      } else if (response.status === 429) {
        rateLimitedCount++;
      }
    }
    
    // We should have some successful requests and some rate limited
    expect(successCount).toBeGreaterThan(0);
    expect(successCount).toBeLessThan(10);
    expect(rateLimitedCount).toBeGreaterThan(0);
    expect(successCount + rateLimitedCount).toBe(10);
  });
});