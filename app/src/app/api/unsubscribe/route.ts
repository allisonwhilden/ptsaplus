import { NextRequest, NextResponse } from 'next/server'
import { handleUnsubscribe } from '@/lib/email/privacy'
import { z } from 'zod'

const unsubscribeSchema = z.object({
  token: z.string().min(1),
  category: z.enum(['announcements', 'events', 'payments', 'volunteer', 'meetings']).nullable().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = unsubscribeSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    const { token, category } = validation.data

    const result = await handleUnsubscribe(
      token,
      category || undefined
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to process unsubscribe request' },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: category 
        ? `Successfully unsubscribed from ${category} emails`
        : 'Successfully unsubscribed from all email communications'
    })
  } catch (error) {
    console.error('[API] Failed to process unsubscribe:', error)
    return NextResponse.json(
      { error: 'Failed to process unsubscribe request' },
      { status: 500 }
    )
  }
}