// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, init) => {
    return {
      url,
      method: init?.method || 'GET',
      headers: new Map(Object.entries(init?.headers || {})),
      json: async () => JSON.parse(init?.body || '{}'),
      text: async () => init?.body || '',
    }
  }),
  NextResponse: {
    json: jest.fn((data, init) => {
      const response = {
        json: async () => data,
        status: init?.status || 200,
        headers: new Map(),
      };
      return response;
    }),
  },
}))

// Add Response to global for tests
global.Response = class Response {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
    this.headers = new Map(Object.entries(init?.headers || {}));
  }
  
  async json() {
    return JSON.parse(this.body);
  }
}

// Mock Clerk
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(() => ({ userId: 'test-user-id' })),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_mock'
process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock'

// Mock headers function
jest.mock('next/headers', () => ({
  headers: jest.fn(() => ({
    get: jest.fn((key) => {
      // This can be overridden in individual tests
      if (key === 'stripe-signature') return 'valid_signature';
      return null;
    }),
  })),
}))