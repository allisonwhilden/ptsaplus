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
    
    // Check if user is admin or board member
    const { data: currentMember } = await supabase
      .from('members')
      .select('role')
      .eq('clerk_id', userId)
      .single()

    if (!currentMember || !['admin', 'board'].includes(currentMember.role)) {
      return NextResponse.json(
        { error: 'Unauthorized to search members' },
        { status: 403 }
      )
    }
    
    // Apply rate limiting
    const rateLimitResponse = await rateLimit(request, RATE_LIMITS.readOperations, userId)
    if (rateLimitResponse) return rateLimitResponse

    // Get search query
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)

    if (query.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      )
    }

    // Search members by name or email
    const { data: members, error } = await supabase
      .from('members')
      .select('id, first_name, last_name, email, role')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(limit)
      .order('last_name', { ascending: true })

    if (error) {
      console.error('[API] Failed to search members:', error)
      return NextResponse.json(
        { error: 'Failed to search members' },
        { status: 500 }
      )
    }

    // Filter out sensitive information for non-admin users
    const sanitizedMembers = members.map(member => ({
      id: member.id,
      name: `${member.first_name} ${member.last_name}`,
      email: member.email,
      role: member.role,
    }))

    return NextResponse.json({ 
      members: sanitizedMembers,
      count: sanitizedMembers.length 
    })
  } catch (error) {
    console.error('[API] Failed to search members:', error)
    return NextResponse.json(
      { error: 'Failed to search members' },
      { status: 500 }
    )
  }
}