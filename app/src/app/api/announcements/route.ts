import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAnnouncement, getAnnouncements } from '@/lib/announcements/service'
import { z } from 'zod'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { logAnnouncementOperation } from '@/lib/audit-logger'

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
    
    // Apply rate limiting for read operations
    const rateLimitResponse = await rateLimit(request, RATE_LIMITS.readOperations, userId)
    if (rateLimitResponse) return rateLimitResponse
    
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') as 'general' | 'urgent' | 'event' | undefined
    const audience = searchParams.get('audience') || undefined
    const includeExpired = searchParams.get('includeExpired') === 'true'
    const pinnedOnly = searchParams.get('pinnedOnly') === 'true'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const result = await getAnnouncements(userId || undefined, {
      type,
      audience,
      includeExpired,
      pinnedOnly,
      page,
      limit,
    })

    return NextResponse.json(result)
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
    
    // Apply rate limiting
    const rateLimitResponse = await rateLimit(request, RATE_LIMITS.announcements, userId)
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const validation = createAnnouncementSchema.safeParse(body)

    if (!validation.success) {
      // Secure error handling - don't expose validation details
      console.error('[API] Validation error:', validation.error.issues)
      return NextResponse.json(
        { error: 'Invalid request data' },
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

    // Audit log the announcement creation
    await logAnnouncementOperation(
      'ANNOUNCEMENT_CREATED',
      userId,
      result.announcement!.id,
      request,
      {
        title: result.announcement!.title,
        type: result.announcement!.type,
        audience: result.announcement!.audience,
        sendEmail: input.sendEmail,
      }
    )

    return NextResponse.json({ announcement: result.announcement })
  } catch (error) {
    console.error('[API] Failed to create announcement:', error)
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    )
  }
}