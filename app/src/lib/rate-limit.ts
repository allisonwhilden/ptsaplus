/**
 * Rate limiting utility for API endpoints
 * Based on the payment system implementation patterns from CLAUDE.md
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per user in window
  maxRequestsPerIP?: number;  // Max requests per IP in window
}

// In-memory store for rate limiting (consider using Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Clean up expired entries from the rate limit store
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Apply rate limiting to a request
 * @param request - The incoming request
 * @param config - Rate limiting configuration
 * @param userId - The authenticated user ID (optional)
 * @returns Response if rate limited, null otherwise
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  userId?: string | null
): Promise<NextResponse | null> {
  const now = Date.now();
  const windowEnd = now + config.windowMs;
  
  // Clean up old entries periodically
  if (Math.random() < 0.01) { // 1% chance to cleanup
    cleanupExpiredEntries();
  }
  
  // Get client IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  // Check user-based rate limit if authenticated
  if (userId) {
    const userKey = `user:${userId}`;
    const userLimit = rateLimitStore.get(userKey);
    
    if (userLimit) {
      if (userLimit.resetTime > now) {
        if (userLimit.count >= config.maxRequests) {
          return NextResponse.json(
            { 
              error: 'Too many requests',
              retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
            },
            { 
              status: 429,
              headers: {
                'Retry-After': String(Math.ceil((userLimit.resetTime - now) / 1000))
              }
            }
          );
        }
        userLimit.count++;
      } else {
        // Reset the window
        userLimit.count = 1;
        userLimit.resetTime = windowEnd;
      }
    } else {
      rateLimitStore.set(userKey, { count: 1, resetTime: windowEnd });
    }
  }
  
  // Check IP-based rate limit
  if (config.maxRequestsPerIP && ip !== 'unknown') {
    const ipKey = `ip:${ip}`;
    const ipLimit = rateLimitStore.get(ipKey);
    const maxIPRequests = config.maxRequestsPerIP;
    
    if (ipLimit) {
      if (ipLimit.resetTime > now) {
        if (ipLimit.count >= maxIPRequests) {
          return NextResponse.json(
            { 
              error: 'Too many requests from this IP',
              retryAfter: Math.ceil((ipLimit.resetTime - now) / 1000)
            },
            { 
              status: 429,
              headers: {
                'Retry-After': String(Math.ceil((ipLimit.resetTime - now) / 1000))
              }
            }
          );
        }
        ipLimit.count++;
      } else {
        // Reset the window
        ipLimit.count = 1;
        ipLimit.resetTime = windowEnd;
      }
    } else {
      rateLimitStore.set(ipKey, { count: 1, resetTime: windowEnd });
    }
  }
  
  return null; // Not rate limited
}

/**
 * Rate limiting configuration for different endpoint types
 */
export const RATE_LIMITS = {
  // Event creation/modification (stricter limits)
  eventMutation: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,       // 5 requests per user per minute
    maxRequestsPerIP: 10  // 10 requests per IP per minute
  },
  
  // Event listing/viewing (more lenient)
  eventRead: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,      // 30 requests per user per minute
    maxRequestsPerIP: 60  // 60 requests per IP per minute
  },
  
  // RSVP operations
  rsvp: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,      // 10 RSVPs per user per minute
    maxRequestsPerIP: 20  // 20 RSVPs per IP per minute
  },
  
  // Volunteer signups
  volunteer: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,      // 10 signups per user per minute
    maxRequestsPerIP: 20  // 20 signups per IP per minute
  },
  
  // Announcement operations (admin/board only)
  announcements: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,       // 5 requests per user per minute
    maxRequestsPerIP: 10  // 10 requests per IP per minute
  },
  
  // Communication preferences
  preferences: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,       // 5 updates per user per minute
    maxRequestsPerIP: 10  // 10 updates per IP per minute
  },
  
  // Unsubscribe operations
  unsubscribe: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 3,       // 3 attempts per user per minute
    maxRequestsPerIP: 5   // 5 attempts per IP per minute
  },
  
  // Read operations (more lenient)
  readOperations: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,      // 60 requests per user per minute
    maxRequestsPerIP: 100 // 100 requests per IP per minute
  }
};