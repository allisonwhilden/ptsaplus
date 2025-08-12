import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { currentUser } from '@clerk/nextjs/server'
import { getSupabaseServiceClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    // Verify user is admin
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseServiceClient()
    const { data: member } = await supabase
      .from('members')
      .select('role')
      .eq('clerk_id', user.id)
      .single()

    if (!member || member.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get tags to revalidate
    const { tags } = await request.json()
    
    if (!tags || !Array.isArray(tags)) {
      return NextResponse.json({ error: 'Invalid tags' }, { status: 400 })
    }

    // Revalidate each tag
    for (const tag of tags) {
      revalidateTag(tag)
    }

    return NextResponse.json({ 
      revalidated: true, 
      tags,
      timestamp: Date.now() 
    })
  } catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}