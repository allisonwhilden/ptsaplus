import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 5, // 5 requests per minute per user
  maxRequestsPerIP: 10, // 10 requests per minute per IP
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime <= now) {
      rateLimitStore.delete(key);
    }
  }
}

// Test helper to clear rate limit store
export function clearRateLimitStore() {
  rateLimitStore.clear();
}

export function checkRateLimit(identifier: string, maxRequests: number = RATE_LIMIT_CONFIG.maxRequests): RateLimitResult {
  cleanupExpiredEntries();
  
  const now = Date.now();
  const resetTime = now + RATE_LIMIT_CONFIG.windowMs;
  
  const entry = rateLimitStore.get(identifier);
  
  if (!entry || entry.resetTime <= now) {
    // New window
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime,
    });
    
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime,
    };
  }
  
  // Existing window
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }
  
  // Increment count
  entry.count++;
  rateLimitStore.set(identifier, entry);
  
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

export function getClientIdentifiers(request: NextRequest): {
  userId?: string;
  ipAddress: string;
} {
  // Get IP address from headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ipAddress = forwardedFor?.split(',')[0].trim() || realIp || 'unknown';
  
  // User ID would come from auth context
  // For now, we'll leave it as optional
  return {
    ipAddress,
  };
}

export function createRateLimitResponse(resetTime: number): Response {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  
  return new Response(
    JSON.stringify({
      error: 'Too many requests. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(resetTime).toISOString(),
      },
    }
  );
}

// Middleware function to apply rate limiting
export async function withRateLimit(
  request: NextRequest,
  handler: () => Promise<Response>,
  userId?: string
): Promise<Response> {
  const { ipAddress } = getClientIdentifiers(request);
  
  // Check user-based rate limit if userId is provided
  if (userId) {
    const userLimit = checkRateLimit(`user:${userId}`);
    if (!userLimit.allowed) {
      return createRateLimitResponse(userLimit.resetTime);
    }
  }
  
  // Always check IP-based rate limit
  const ipLimit = checkRateLimit(`ip:${ipAddress}`, RATE_LIMIT_CONFIG.maxRequestsPerIP);
  if (!ipLimit.allowed) {
    return createRateLimitResponse(ipLimit.resetTime);
  }
  
  // Execute the handler
  const response = await handler();
  
  // Add rate limit headers to successful responses
  if (userId) {
    const userLimit = checkRateLimit(`user:${userId}`);
    response.headers.set('X-RateLimit-Limit', RATE_LIMIT_CONFIG.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', userLimit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(userLimit.resetTime).toISOString());
  }
  
  return response;
}