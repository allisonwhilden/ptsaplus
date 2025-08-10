/**
 * Rate Limiting for Privacy Endpoints
 * Protects sensitive operations from abuse
 */

import { NextRequest } from 'next/server';
import { LRUCache } from 'lru-cache';
import crypto from 'crypto';

// Rate limit configurations for different operations
export const RATE_LIMITS = {
  // Data export/deletion (strict limits)
  dataExport: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 3,
    message: 'Too many data export requests. Please try again in 24 hours.'
  },
  dataDeletion: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 1,
    message: 'Account deletion already requested. Please check your email.'
  },
  
  // Consent operations (moderate limits)
  consentUpdate: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'Too many consent updates. Please try again later.'
  },
  coppaVerification: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    message: 'Too many verification attempts. Please try again in 1 hour.'
  },
  
  // Privacy settings (relaxed limits)
  privacySettingsRead: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Too many requests. Please slow down.'
  },
  privacySettingsUpdate: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many updates. Please try again in a minute.'
  },
  
  // Audit log access (admin)
  auditLogAccess: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    message: 'Too many audit log requests. Please slow down.'
  },
  auditLogExport: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    message: 'Too many audit exports. Please try again later.'
  }
};

// Create separate caches for different rate limit types
const caches = new Map<string, LRUCache<string, number[]>>();

// Initialize caches
Object.keys(RATE_LIMITS).forEach(key => {
  caches.set(key, new LRUCache<string, number[]>({
    max: 10000, // Max number of keys to store
    ttl: RATE_LIMITS[key as keyof typeof RATE_LIMITS].windowMs,
  }));
});

/**
 * Get identifier for rate limiting (user ID or IP)
 */
function getIdentifier(request: NextRequest, userId?: string): string {
  // Prefer user ID if available
  if (userId) {
    return `user:${userId}`;
  }
  
  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  
  // Hash the IP for privacy
  return `ip:${crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16)}`;
}

/**
 * Check if request is rate limited
 */
export function isRateLimited(
  request: NextRequest,
  limitType: keyof typeof RATE_LIMITS,
  userId?: string
): {
  limited: boolean;
  remaining: number;
  resetAt: Date;
  message?: string;
} {
  const cache = caches.get(limitType);
  if (!cache) {
    throw new Error(`Unknown rate limit type: ${limitType}`);
  }
  
  const limit = RATE_LIMITS[limitType];
  const identifier = getIdentifier(request, userId);
  const now = Date.now();
  
  // Get existing timestamps for this identifier
  let timestamps = cache.get(identifier) || [];
  
  // Remove timestamps outside the window
  timestamps = timestamps.filter(ts => now - ts < limit.windowMs);
  
  // Check if limit exceeded
  if (timestamps.length >= limit.maxRequests) {
    const oldestTimestamp = Math.min(...timestamps);
    const resetAt = new Date(oldestTimestamp + limit.windowMs);
    
    return {
      limited: true,
      remaining: 0,
      resetAt,
      message: limit.message
    };
  }
  
  // Add current timestamp
  timestamps.push(now);
  cache.set(identifier, timestamps);
  
  const remaining = limit.maxRequests - timestamps.length;
  const resetAt = new Date(now + limit.windowMs);
  
  return {
    limited: false,
    remaining,
    resetAt
  };
}

/**
 * Rate limiting middleware
 */
export async function withRateLimit(
  request: NextRequest,
  limitType: keyof typeof RATE_LIMITS,
  handler: () => Promise<Response>,
  userId?: string
): Promise<Response> {
  const result = isRateLimited(request, limitType, userId);
  
  if (result.limited) {
    return new Response(
      JSON.stringify({
        error: result.message,
        retryAfter: result.resetAt.toISOString()
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(RATE_LIMITS[limitType].maxRequests),
          'X-RateLimit-Remaining': String(result.remaining),
          'X-RateLimit-Reset': result.resetAt.toISOString(),
          'Retry-After': String(Math.ceil((result.resetAt.getTime() - Date.now()) / 1000))
        }
      }
    );
  }
  
  // Execute handler and add rate limit headers to response
  const response = await handler();
  
  // Clone response to add headers
  const newHeaders = new Headers(response.headers);
  newHeaders.set('X-RateLimit-Limit', String(RATE_LIMITS[limitType].maxRequests));
  newHeaders.set('X-RateLimit-Remaining', String(result.remaining));
  newHeaders.set('X-RateLimit-Reset', result.resetAt.toISOString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

/**
 * Distributed rate limiting using Redis/Upstash
 * For production use with multiple servers
 */
interface RedisClient {
  pipeline(): {
    zremrangebyscore(key: string, min: number, max: number): void;
    zcard(key: string): void;
    zadd(key: string, score: number, member: string): void;
    expire(key: string, seconds: number): void;
    exec(): Promise<[unknown, unknown][]>;
  };
  zrange(key: string, start: number, stop: number, withScores: string): Promise<string[]>;
}

export class DistributedRateLimiter {
  private redisClient: RedisClient;
  
  constructor(redisClient: unknown) {
    this.redisClient = redisClient as RedisClient;
  }
  
  async isRateLimited(
    identifier: string,
    limitType: keyof typeof RATE_LIMITS
  ): Promise<{
    limited: boolean;
    remaining: number;
    resetAt: Date;
  }> {
    const limit = RATE_LIMITS[limitType];
    const key = `rate_limit:${limitType}:${identifier}`;
    const now = Date.now();
    const window = now - limit.windowMs;
    
    // Use Redis sorted set to track timestamps
    const pipeline = this.redisClient.pipeline();
    
    // Remove old entries outside the window
    pipeline.zremrangebyscore(key, 0, window);
    
    // Count current entries
    pipeline.zcard(key);
    
    // Add current timestamp if not limited
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    
    // Set expiry
    pipeline.expire(key, Math.ceil(limit.windowMs / 1000));
    
    const results = await pipeline.exec();
    const count = results[1][1] as number;
    
    if (count >= limit.maxRequests) {
      // Get oldest timestamp to calculate reset time
      const oldest = await this.redisClient.zrange(key, 0, 0, 'WITHSCORES');
      const resetAt = new Date(parseInt(oldest[1]) + limit.windowMs);
      
      return {
        limited: true,
        remaining: 0,
        resetAt
      };
    }
    
    return {
      limited: false,
      remaining: limit.maxRequests - count - 1,
      resetAt: new Date(now + limit.windowMs)
    };
  }
}

/**
 * Adaptive rate limiting based on user behavior
 */
export class AdaptiveRateLimiter {
  private userScores = new Map<string, number>();
  private suspiciousPatterns = new Map<string, number>();
  
  /**
   * Adjust rate limits based on user behavior
   */
  getAdaptiveLimit(
    userId: string,
    baseLimit: number
  ): number {
    const score = this.userScores.get(userId) || 100;
    const suspicionLevel = this.suspiciousPatterns.get(userId) || 0;
    
    // Reduce limit for suspicious users
    if (suspicionLevel > 5) {
      return Math.max(1, Math.floor(baseLimit * 0.25));
    }
    
    // Increase limit for trusted users
    if (score > 150) {
      return Math.floor(baseLimit * 1.5);
    }
    
    return baseLimit;
  }
  
  /**
   * Update user score based on behavior
   */
  updateUserScore(userId: string, action: 'good' | 'bad' | 'suspicious'): void {
    const currentScore = this.userScores.get(userId) || 100;
    
    switch (action) {
      case 'good':
        this.userScores.set(userId, Math.min(200, currentScore + 5));
        break;
      case 'bad':
        this.userScores.set(userId, Math.max(0, currentScore - 20));
        break;
      case 'suspicious':
        const suspicion = this.suspiciousPatterns.get(userId) || 0;
        this.suspiciousPatterns.set(userId, suspicion + 1);
        this.userScores.set(userId, Math.max(0, currentScore - 10));
        break;
    }
  }
  
  /**
   * Detect suspicious patterns
   */
  detectSuspiciousPattern(
    userId: string,
    requests: Array<{ endpoint: string; timestamp: number }>
  ): boolean {
    // Check for rapid sequential requests to different privacy endpoints
    if (requests.length < 5) return false;
    
    const recentRequests = requests.slice(-10);
    const uniqueEndpoints = new Set(recentRequests.map(r => r.endpoint));
    
    // Suspicious if hitting many different endpoints rapidly
    if (uniqueEndpoints.size > 5) {
      const timeSpan = recentRequests[recentRequests.length - 1].timestamp - recentRequests[0].timestamp;
      if (timeSpan < 60000) { // Within 1 minute
        this.updateUserScore(userId, 'suspicious');
        return true;
      }
    }
    
    return false;
  }
}

/**
 * Reset rate limit for a specific user (admin action)
 */
export function resetRateLimit(
  limitType: keyof typeof RATE_LIMITS,
  identifier: string
): boolean {
  const cache = caches.get(limitType);
  if (!cache) return false;
  
  cache.delete(identifier);
  return true;
}

/**
 * Get rate limit statistics
 */
export function getRateLimitStats(): {
  type: string;
  currentEntries: number;
  cacheSize: number;
}[] {
  const stats = [];
  
  for (const [type, cache] of caches.entries()) {
    stats.push({
      type,
      currentEntries: cache.size,
      cacheSize: cache.calculatedSize || 0
    });
  }
  
  return stats;
}