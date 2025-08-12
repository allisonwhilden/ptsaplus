import { unstable_cache } from 'next/cache'
import { cache } from 'react'

// Cache durations in seconds
export const CACHE_DURATIONS = {
  REAL_TIME: 30,           // 30 seconds for critical real-time data
  DYNAMIC: 120,            // 2 minutes for dynamic content
  ANALYTICS: 300,          // 5 minutes for analytics data
  AGGREGATE: 600,          // 10 minutes for aggregated stats
  TRENDS: 900,            // 15 minutes for trend data
  HISTORICAL: 3600,       // 1 hour for historical data
} as const

// Cache tags for invalidation
export const CACHE_TAGS = {
  MEMBERS: 'members',
  PAYMENTS: 'payments',
  EVENTS: 'events',
  RSVPS: 'rsvps',
  VOLUNTEERS: 'volunteers',
  DASHBOARD: 'dashboard',
} as const

// Dashboard-specific cache wrapper with proper type inference
export function createCachedQuery<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    tags: string[]
    revalidate: number
    key: string
  }
): T {
  return unstable_cache(
    fn,
    [options.key],
    {
      tags: options.tags,
      revalidate: options.revalidate,
    }
  ) as T
}

// React cache for request deduplication
export const getDashboardData = cache(async (userId: string, role: string) => {
  // This ensures multiple components requesting the same data
  // within a single request only fetch once
  return {
    userId,
    role,
    timestamp: Date.now(),
  }
})

// Cache key generators
export const cacheKeys = {
  memberStats: (orgId?: string) => `member-stats-${orgId || 'default'}`,
  revenueStats: (period: string) => `revenue-stats-${period}`,
  eventList: (status: string) => `events-${status}`,
  volunteerStats: () => 'volunteer-stats',
  dashboardAdmin: () => 'dashboard-admin',
  dashboardTreasurer: () => 'dashboard-treasurer',
  dashboardBoard: () => 'dashboard-board',
  dashboardMember: (userId: string) => `dashboard-member-${userId}`,
}

// Cache invalidation helper
export async function invalidateCache(tags: string[]) {
  // This would be called after mutations
  // Next.js will handle the actual invalidation
  try {
    await fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags }),
    })
  } catch (error) {
    console.error('Cache invalidation failed:', error)
  }
}