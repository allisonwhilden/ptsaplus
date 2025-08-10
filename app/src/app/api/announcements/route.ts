import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAnnouncement, getAnnouncements } from '@/lib/announcements/service'
import { z } from 'zod'

const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  type: z.enum(['general', 'urgent', 'event']),
  audience: z.enum(['all', 'members', 'board', 'committee_chairs', 'teachers']),
  publishedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  isPinned: z.boolean().optional(),
  sendEmail: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') as 'general' | 'urgent' | 'event' | undefined
    const audience = searchParams.get('audience') || undefined
    const includeExpired = searchParams.get('includeExpired') === 'true'
    const pinnedOnly = searchParams.get('pinnedOnly') === 'true'

    const announcements = await getAnnouncements(userId || undefined, {
      type,
      audience,
      includeExpired,
      pinnedOnly,
    })

    return NextResponse.json({ announcements })
  } catch (error) {
    console.error('[API] Failed to get announcements:', error)
    return NextResponse.json(
      { error: 'Failed to get announcements' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = createAnnouncementSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const input = {
      ...validation.data,
      publishedAt: validation.data.publishedAt 
        ? new Date(validation.data.publishedAt)
        : undefined,
      expiresAt: validation.data.expiresAt
        ? new Date(validation.data.expiresAt)
        : undefined,
    }

    const result = await createAnnouncement(userId, input)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Unauthorized to create announcements' ? 403 : 400 }
      )
    }

    return NextResponse.json({ announcement: result.announcement })
  } catch (error) {
    console.error('[API] Failed to create announcement:', error)
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    )
  }
}