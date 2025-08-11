import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { logPreferenceChange } from '@/lib/audit-logger'
import { POSTGRES_ERROR_CODES, isNotFoundError, getSafeErrorInfo } from '@/lib/database-errors'

const preferencesSchema = z.object({
  emailEnabled: z.boolean(),
  emailFrequency: z.enum(['immediate', 'daily', 'weekly', 'monthly']),
  announcementsEnabled: z.boolean(),
  eventsEnabled: z.boolean(),
  paymentsEnabled: z.boolean(),
  volunteerEnabled: z.boolean(),
  meetingsEnabled: z.boolean(),
})

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('communication_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Not found is expected for new users
    if (error && !isNotFoundError(error)) {
      const safeError = getSafeErrorInfo(error)
      console.error('[API] Database error:', safeError)
      throw new Error(safeError.safe_message)
    }

    const preferences = data || {
      email_enabled: false,
      email_frequency: 'weekly',
      announcements_enabled: false,
      events_enabled: false,
      payments_enabled: true,
      volunteer_enabled: false,
      meetings_enabled: false,
    }

    return NextResponse.json({
      preferences: {
        emailEnabled: preferences.email_enabled,
        emailFrequency: preferences.email_frequency,
        announcementsEnabled: preferences.announcements_enabled,
        eventsEnabled: preferences.events_enabled,
        paymentsEnabled: preferences.payments_enabled,
        volunteerEnabled: preferences.volunteer_enabled,
        meetingsEnabled: preferences.meetings_enabled,
        unsubscribedAt: preferences.unsubscribed_at,
      }
    })
  } catch (error) {
    console.error('[API] Failed to get communication preferences:', error)
    return NextResponse.json(
      { error: 'Failed to get communication preferences' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Apply rate limiting
    const rateLimitResponse = await rateLimit(request, RATE_LIMITS.preferences, userId)
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const validation = preferencesSchema.safeParse(body)

    if (!validation.success) {
      // Secure error handling - don't expose validation details
      console.error('[API] Validation error:', validation.error.issues)
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const updateData = {
      user_id: userId,
      email_enabled: validation.data.emailEnabled,
      email_frequency: validation.data.emailFrequency,
      announcements_enabled: validation.data.announcementsEnabled,
      events_enabled: validation.data.eventsEnabled,
      payments_enabled: validation.data.paymentsEnabled,
      volunteer_enabled: validation.data.volunteerEnabled,
      meetings_enabled: validation.data.meetingsEnabled,
      unsubscribed_at: null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('communication_preferences')
      .upsert(updateData, {
        onConflict: 'user_id',
      })
      .select()
      .single()

    if (error) throw error

    // Audit log the preference changes
    await logPreferenceChange(userId, validation.data, request)

    return NextResponse.json({
      preferences: {
        emailEnabled: data.email_enabled,
        emailFrequency: data.email_frequency,
        announcementsEnabled: data.announcements_enabled,
        eventsEnabled: data.events_enabled,
        paymentsEnabled: data.payments_enabled,
        volunteerEnabled: data.volunteer_enabled,
        meetingsEnabled: data.meetings_enabled,
        unsubscribedAt: data.unsubscribed_at,
      }
    })
  } catch (error) {
    console.error('[API] Failed to update communication preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update communication preferences' },
      { status: 500 }
    )
  }
}