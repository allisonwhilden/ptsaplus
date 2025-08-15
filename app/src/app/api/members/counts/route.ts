import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabaseServiceClient } from '@/lib/supabase-server'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    const authData = await auth()
    const userId = authData?.userId
    const supabase = getSupabaseServiceClient()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Apply rate limiting
    const rateLimitResponse = await rateLimit(request, RATE_LIMITS.readOperations, userId)
    if (rateLimitResponse) return rateLimitResponse

    // Get counts for each audience type
    const [allCount, boardCount, committeeCount, teacherCount] = await Promise.all([
      supabase.from('members').select('id', { count: 'exact', head: true }),
      supabase.from('members').select('id', { count: 'exact', head: true }).eq('role', 'board'),
      supabase.from('members').select('id', { count: 'exact', head: true }).eq('role', 'committee_chair'),
      supabase.from('members').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
    ])

    return NextResponse.json({
      all: allCount.count || 0,
      board: boardCount.count || 0,
      committee_chairs: committeeCount.count || 0,
      teachers: teacherCount.count || 0,
    })
  } catch (error) {
    console.error('[API] Failed to get member counts:', error)
    return NextResponse.json(
      { error: 'Failed to get member counts' },
      { status: 500 }
    )
  }
}