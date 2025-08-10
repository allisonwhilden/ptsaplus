import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { 
  getAnnouncementById, 
  updateAnnouncement, 
  deleteAnnouncement,
  markAnnouncementAsRead 
} from '@/lib/announcements/service'
import { z } from 'zod'

const updateAnnouncementSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
  type: z.enum(['general', 'urgent', 'event']).optional(),
  audience: z.enum(['all', 'members', 'board', 'committee_chairs', 'teachers']).optional(),
  publishedAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  isPinned: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    const announcementId = params.id

    const announcement = await getAnnouncementById(announcementId, userId || undefined)

    if (!announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

    if (userId) {
      await markAnnouncementAsRead(userId, announcementId)
    }

    return NextResponse.json({ announcement })
  } catch (error) {
    console.error('[API] Failed to get announcement:', error)
    return NextResponse.json(
      { error: 'Failed to get announcement' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const announcementId = params.id
    const body = await request.json()
    const validation = updateAnnouncementSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const input = {
      ...validation.data,
      publishedAt: validation.data.publishedAt !== undefined
        ? (validation.data.publishedAt ? new Date(validation.data.publishedAt) : null)
        : undefined,
      expiresAt: validation.data.expiresAt !== undefined
        ? (validation.data.expiresAt ? new Date(validation.data.expiresAt) : null)
        : undefined,
    }

    const result = await updateAnnouncement(userId, announcementId, input)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes('Unauthorized') ? 403 : 400 }
      )
    }

    return NextResponse.json({ announcement: result.announcement })
  } catch (error) {
    console.error('[API] Failed to update announcement:', error)
    return NextResponse.json(
      { error: 'Failed to update announcement' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const announcementId = params.id
    const result = await deleteAnnouncement(userId, announcementId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes('Unauthorized') ? 403 : 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Failed to delete announcement:', error)
    return NextResponse.json(
      { error: 'Failed to delete announcement' },
      { status: 500 }
    )
  }
}