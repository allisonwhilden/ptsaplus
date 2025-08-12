import { getSupabaseServiceClient } from '@/lib/supabase-server'
import { createCachedQuery, CACHE_DURATIONS, CACHE_TAGS, cacheKeys } from '@/lib/cache'

// Type definitions
interface MemberStats {
  total: number
  active: number
  pending: number
  rate: string | number
}

interface RevenueStats {
  total: number
  byType: Record<string, number>
  count: number
  average: number
}

interface Event {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string | null
  location: string | null
  max_capacity: number | null
  event_rsvps?: { count: number }[]
}

interface VolunteerStats {
  totalVolunteers: number
  recentSignups: any[]
  upcomingSlots: any[]
}

interface AdminDashboardData {
  memberStats: MemberStats
  revenueStats: RevenueStats
  events: Event[]
  volunteerStats: VolunteerStats
  timestamp: number
}

interface ChartDataPoint {
  month: string
  value: number
}

// Cached member statistics
export const getMemberStats = createCachedQuery(
  async (): Promise<MemberStats> => {
    const supabase = getSupabaseServiceClient()
    
    const [
      { count: totalMembers },
      { count: activeMembers },
      { count: pendingMembers }
    ] = await Promise.all([
      supabase.from('members').select('*', { count: 'exact', head: true }),
      supabase.from('members').select('*', { count: 'exact', head: true }).eq('membership_status', 'active'),
      supabase.from('members').select('*', { count: 'exact', head: true }).eq('membership_status', 'pending')
    ])
    
    return {
      total: totalMembers || 0,
      active: activeMembers || 0,
      pending: pendingMembers || 0,
      rate: totalMembers ? ((activeMembers || 0) / totalMembers * 100).toFixed(1) : 0
    }
  },
  {
    tags: [CACHE_TAGS.MEMBERS, CACHE_TAGS.DASHBOARD],
    revalidate: CACHE_DURATIONS.AGGREGATE,
    key: cacheKeys.memberStats()
  }
)

// Cached revenue statistics
export const getRevenueStats = createCachedQuery(
  async (period: 'month' | 'quarter' | 'year' = 'month'): Promise<RevenueStats> => {
    const supabase = getSupabaseServiceClient()
    
    const startDate = new Date()
    switch (period) {
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1)
        break
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3)
        break
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
    }
    
    const { data: payments } = await supabase
      .from('payments')
      .select('amount, created_at, type')
      .eq('status', 'succeeded')
      .gte('created_at', startDate.toISOString())
    
    const total = payments?.reduce((sum, p) => sum + (p.amount / 100), 0) || 0
    const byType = payments?.reduce((acc, p) => {
      const type = p.type || 'other'
      acc[type] = (acc[type] || 0) + (p.amount / 100)
      return acc
    }, {} as Record<string, number>) || {}
    
    return {
      total,
      byType,
      count: payments?.length || 0,
      average: payments?.length ? total / payments.length : 0
    }
  },
  {
    tags: [CACHE_TAGS.PAYMENTS, CACHE_TAGS.DASHBOARD],
    revalidate: CACHE_DURATIONS.ANALYTICS,
    key: cacheKeys.revenueStats('month')
  }
)

// Cached upcoming events
export const getUpcomingEvents = createCachedQuery(
  async (limit: number = 10): Promise<Event[]> => {
    const supabase = getSupabaseServiceClient()
    
    const { data: events } = await supabase
      .from('events')
      .select(`
        id,
        title,
        description,
        start_time,
        end_time,
        location,
        max_capacity,
        event_rsvps (count)
      `)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(limit)
    
    return events || []
  },
  {
    tags: [CACHE_TAGS.EVENTS, CACHE_TAGS.DASHBOARD],
    revalidate: CACHE_DURATIONS.ANALYTICS,
    key: cacheKeys.eventList('upcoming')
  }
)

// Cached volunteer statistics
export const getVolunteerStats = createCachedQuery(
  async (): Promise<VolunteerStats> => {
    const supabase = getSupabaseServiceClient()
    
    const [
      { count: totalVolunteers },
      { data: recentSignups },
      { data: upcomingSlots }
    ] = await Promise.all([
      supabase
        .from('event_volunteer_signups')
        .select('user_id', { count: 'exact', head: true }),
      supabase
        .from('event_volunteer_signups')
        .select(`
          *,
          event_volunteer_slots (
            title,
            events (title, start_time)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('event_volunteer_slots')
        .select('*')
        .gt('spots_available', 0)
        .limit(5)
    ])
    
    return {
      totalVolunteers: totalVolunteers || 0,
      recentSignups: recentSignups || [],
      upcomingSlots: upcomingSlots || []
    }
  },
  {
    tags: [CACHE_TAGS.VOLUNTEERS, CACHE_TAGS.DASHBOARD],
    revalidate: CACHE_DURATIONS.ANALYTICS,
    key: cacheKeys.volunteerStats()
  }
)

// Combined dashboard data for admin
export const getAdminDashboardData = createCachedQuery(
  async (): Promise<AdminDashboardData> => {
    const [memberStats, revenueStats, events, volunteerStats] = await Promise.all([
      getMemberStats(),
      getRevenueStats('month'),
      getUpcomingEvents(5),
      getVolunteerStats()
    ])
    
    return {
      memberStats,
      revenueStats,
      events,
      volunteerStats,
      timestamp: Date.now()
    }
  },
  {
    tags: [CACHE_TAGS.DASHBOARD],
    revalidate: CACHE_DURATIONS.DYNAMIC,
    key: cacheKeys.dashboardAdmin()
  }
)

// Chart data with longer cache
export const getChartData = createCachedQuery(
  async (type: 'revenue' | 'membership' | 'events'): Promise<ChartDataPoint[]> => {
    const supabase = getSupabaseServiceClient()
    
    // Generate last 6 months of data
    const months = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now)
      date.setMonth(date.getMonth() - i)
      months.push({
        start: new Date(date.getFullYear(), date.getMonth(), 1),
        end: new Date(date.getFullYear(), date.getMonth() + 1, 0),
        label: date.toLocaleDateString('en-US', { month: 'short' })
      })
    }
    
    switch (type) {
      case 'revenue': {
        const data = await Promise.all(months.map(async (month) => {
          const { data: payments } = await supabase
            .from('payments')
            .select('amount')
            .eq('status', 'succeeded')
            .gte('created_at', month.start.toISOString())
            .lte('created_at', month.end.toISOString())
          
          const total = payments?.reduce((sum, p) => sum + (p.amount / 100), 0) || 0
          return { month: month.label, value: total }
        }))
        return data
      }
      
      case 'membership': {
        const data = await Promise.all(months.map(async (month) => {
          const { count } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .lte('created_at', month.end.toISOString())
            .eq('membership_status', 'active')
          
          return { month: month.label, value: count || 0 }
        }))
        return data
      }
      
      case 'events': {
        const data = await Promise.all(months.map(async (month) => {
          const { count } = await supabase
            .from('events')
            .select('*', { count: 'exact', head: true })
            .gte('start_time', month.start.toISOString())
            .lte('start_time', month.end.toISOString())
          
          return { month: month.label, value: count || 0 }
        }))
        return data
      }
      
      default:
        return []
    }
  },
  {
    tags: [CACHE_TAGS.DASHBOARD],
    revalidate: CACHE_DURATIONS.TRENDS,
    key: 'chart-data'
  }
)