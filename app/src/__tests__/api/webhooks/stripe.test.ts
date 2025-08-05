import { NextRequest } from 'next/server';
import { POST } from '@/app/api/webhooks/stripe/route';
import { stripe } from '@/lib/stripe/server';

// Mock dependencies
jest.mock('@/lib/stripe/server', () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn(),
    },
  },
  constructWebhookEvent: jest.fn(),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ error: null })),
        })),
      })),
      insert: jest.fn(() => ({ error: null })),
    })),
  })),
}));

const mockConstructWebhookEvent = require('@/lib/stripe/server').constructWebhookEvent;
const mockHeaders = require('next/headers').headers;

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset headers mock to default behavior
    mockHeaders.mockReturnValue({
      get: jest.fn((key) => {
        if (key === 'stripe-signature') return 'valid_signature';
        return null;
      }),
    });
  });

  it('should handle payment_intent.succeeded event', async () => {
    const mockEvent = {
      id: 'evt_test_123',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_123',
          amount: 1500,
          currency: 'usd',
          metadata: {
            userId: 'user_123',
            paymentType: 'membership',
          },
          payment_method_types: ['card'],
        },
      },
    };

    mockConstructWebhookEvent.mockResolvedValue(mockEvent);

    const request = new NextRequest('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': 'valid_signature',
      },
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ received: true });
    expect(mockConstructWebhookEvent).toHaveBeenCalled();
  });

  it('should handle payment_intent.payment_failed event', async () => {
    const mockEvent = {
      id: 'evt_test_456',
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: 'pi_test_456',
          amount: 2500,
          metadata: {
            userId: 'user_456',
            paymentType: 'membership',
          },
          last_payment_error: {
            message: 'Card was declined',
          },
        },
      },
    };

    mockConstructWebhookEvent.mockResolvedValue(mockEvent);

    const request = new NextRequest('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': 'valid_signature',
      },
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  it('should reject requests without signature', async () => {
    // Mock headers to return null for stripe-signature
    mockHeaders.mockReturnValue({
      get: jest.fn((key) => {
        if (key === 'stripe-signature') return null;
        return null;
      }),
    });

    const request = new NextRequest('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify({ type: 'payment_intent.succeeded' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Missing signature' });
  });

  it('should reject requests with invalid signature', async () => {
    mockConstructWebhookEvent.mockRejectedValue(new Error('Invalid signature'));

    const request = new NextRequest('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': 'invalid_signature',
      },
      body: JSON.stringify({ type: 'payment_intent.succeeded' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Invalid signature' });
  });

  it('should handle unhandled event types gracefully', async () => {
    const mockEvent = {
      id: 'evt_test_789',
      type: 'customer.created',
      data: {
        object: {
          id: 'cus_test_123',
        },
      },
    };

    mockConstructWebhookEvent.mockResolvedValue(mockEvent);

    const request = new NextRequest('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': 'valid_signature',
      },
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ received: true });
  });

  it('should handle payment_intent.canceled event', async () => {
    const mockEvent = {
      id: 'evt_test_cancel',
      type: 'payment_intent.canceled',
      data: {
        object: {
          id: 'pi_test_cancel',
          amount: 5000,
          metadata: {
            userId: 'user_789',
            paymentType: 'membership',
          },
        },
      },
    };

    mockConstructWebhookEvent.mockResolvedValue(mockEvent);

    const request = new NextRequest('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': 'valid_signature',
      },
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  it('should handle database errors gracefully', async () => {
    const mockEvent = {
      id: 'evt_test_db_error',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_db_error',
          amount: 1500,
          metadata: {
            userId: 'user_db_error',
            paymentType: 'membership',
          },
          payment_method_types: ['card'],
        },
      },
    };

    mockConstructWebhookEvent.mockResolvedValue(mockEvent);

    // Mock database error
    const mockSupabase = require('@supabase/supabase-js').createClient();
    mockSupabase.from.mockReturnValue({
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ error: new Error('Database error') })),
        })),
      })),
      insert: jest.fn(() => ({ error: new Error('Database error') })),
    });

    const request = new NextRequest('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': 'valid_signature',
      },
      body: JSON.stringify(mockEvent),
    });

    // Should still return 200 to Stripe even if database update fails
    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});