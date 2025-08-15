// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock TextDecoder/TextEncoder for tests (required for @react-email)
const { TextDecoder: NodeTextDecoder, TextEncoder: NodeTextEncoder } = require('util')
global.TextDecoder = global.TextDecoder || NodeTextDecoder
global.TextEncoder = global.TextEncoder || NodeTextEncoder

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return []
  }
}

// Mock scrollIntoView for Radix UI Select components
Element.prototype.scrollIntoView = jest.fn()

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  })),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  usePathname: jest.fn(() => '/'),
  redirect: jest.fn(),
  notFound: jest.fn(),
}))

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, init) => {
    const parsedUrl = new URL(url);
    return {
      url,
      nextUrl: parsedUrl,
      method: init?.method || 'GET',
      headers: new Map(Object.entries(init?.headers || {})),
      json: async () => {
        if (init?.body) {
          try {
            return JSON.parse(init.body);
          } catch {
            return {};
          }
        }
        return {};
      },
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
    redirect: jest.fn((url, status = 302) => {
      return {
        status,
        headers: new Map([['Location', url]]),
      };
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
  auth: jest.fn(() => Promise.resolve({ userId: 'test-user-id' })),
}))

// Mock rate limiting to avoid test failures
jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn().mockResolvedValue(null), // Never rate limit in tests
  RATE_LIMITS: {
    eventMutation: { windowMs: 60000, maxRequests: 100, maxRequestsPerIP: 200 },
    eventRead: { windowMs: 60000, maxRequests: 100, maxRequestsPerIP: 200 },
    rsvp: { windowMs: 60000, maxRequests: 100, maxRequestsPerIP: 200 },
    volunteer: { windowMs: 60000, maxRequests: 100, maxRequestsPerIP: 200 },
    emails: { windowMs: 60000, maxRequests: 3, maxRequestsPerIP: 5 },
    readOperations: { windowMs: 60000, maxRequests: 60, maxRequestsPerIP: 100 },
  }
}))

// Mock privacy rate limiting
jest.mock('@/lib/privacy/rate-limit', () => ({
  withRateLimit: jest.fn((request, key, handler) => handler()),
}))

// Mock Supabase client
jest.mock('@/config/supabase', () => ({
  createClient: jest.fn(),
  supabase: {}
}))

// Mock environment variables
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_mock'
process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_anon_key'
process.env.SUPABASE_SERVICE_KEY = 'test_service_key'

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