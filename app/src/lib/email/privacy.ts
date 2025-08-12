import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase-server'

export function hashEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase()).digest('hex')
}

export function extractEmailDomain(email: string): string {
  const parts = email.split('@')
  return parts.length === 2 ? parts[1].toLowerCase() : ''
}

export async function checkEmailConsent(
  userId: string,
  category: 'announcements' | 'events' | 'payments' | 'volunteer' | 'meetings'
): Promise<{ canSend: boolean; reason?: string }> {
  try {
    const supabase = await createClient()

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*, members!inner(*)')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return { canSend: false, reason: 'User not found' }
    }

    const { data: prefs, error: prefsError } = await supabase
      .from('communication_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (prefsError && prefsError.code !== 'PGRST116') {
      console.error('[Privacy] Error fetching preferences:', prefsError)
      return { canSend: false, reason: 'Error checking preferences' }
    }

    if (!prefs) {
      if (category === 'payments') {
        return { canSend: true }
      }
      return { canSend: false, reason: 'No communication preferences set' }
    }

    if (user.members?.parent_consent_required && !prefs.parent_consent_verified) {
      return { canSend: false, reason: 'Parental consent required but not verified' }
    }

    if (prefs.unsubscribed_at) {
      return { canSend: false, reason: 'User has unsubscribed from all communications' }
    }

    if (!prefs.email_enabled && category !== 'payments') {
      return { canSend: false, reason: 'Email communications disabled' }
    }

    const categoryKey = `${category}_enabled` as keyof typeof prefs
    const categoryEnabled = prefs[categoryKey]
    
    if (categoryEnabled === false) {
      return { canSend: false, reason: `${category} emails disabled by user preference` }
    }

    return { canSend: true }
  } catch (error) {
    console.error('[Privacy] Error checking consent:', error)
    return { canSend: false, reason: 'Error checking consent' }
  }
}

export async function getUserEmailSecure(userId: string): Promise<string | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return null
    }

    return data.email
  } catch (error) {
    console.error('[Privacy] Error fetching user email:', error)
    return null
  }
}

export async function logEmailSecure(log: {
  userId?: string
  email: string
  subject: string
  template?: string
  category?: string
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'complained'
  metadata?: Record<string, any>
  error?: string
}): Promise<void> {
  try {
    const supabase = await createClient()

    const secureLog = {
      user_id: log.userId,
      recipient_hash: hashEmail(log.email),
      recipient_domain: extractEmailDomain(log.email),
      subject: log.subject,
      template: log.template,
      category: log.category,
      status: log.status,
      metadata: log.metadata || {},
      error_message: log.error,
      sent_at: log.status === 'sent' ? new Date().toISOString() : undefined,
      created_at: new Date().toISOString(),
    }

    await supabase.from('email_logs').insert(secureLog)
  } catch (error) {
    console.error('[Privacy] Failed to log email securely:', error)
  }
}

export function generateUnsubscribeToken(userId: string, email: string): string {
  const payload = {
    userId,
    emailHash: hashEmail(email),
    timestamp: Date.now(),
  }
  
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

export function verifyUnsubscribeToken(token: string): { userId: string; emailHash: string } | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64url').toString())
    
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    if (payload.timestamp < oneWeekAgo) {
      return null
    }
    
    return {
      userId: payload.userId,
      emailHash: payload.emailHash,
    }
  } catch (error) {
    console.error('[Privacy] Invalid unsubscribe token:', error)
    return null
  }
}

export async function handleUnsubscribe(
  token: string,
  category?: 'announcements' | 'events' | 'payments' | 'volunteer' | 'meetings'
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = verifyUnsubscribeToken(token)
    if (!payload) {
      return { success: false, error: 'Invalid or expired unsubscribe link' }
    }

    const supabase = await createClient()

    if (category) {
      const updateData = {
        [`${category}_enabled`]: false,
        updated_at: new Date().toISOString(),
      }
      
      const { error } = await supabase
        .from('communication_preferences')
        .update(updateData)
        .eq('user_id', payload.userId)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('communication_preferences')
        .update({
          email_enabled: false,
          unsubscribed_at: new Date().toISOString(),
          unsubscribe_reason: 'User requested via unsubscribe link',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', payload.userId)

      if (error) throw error
    }

    return { success: true }
  } catch (error) {
    console.error('[Privacy] Error handling unsubscribe:', error)
    return { success: false, error: 'Failed to process unsubscribe request' }
  }
}

export async function createOrUpdateCommunicationPreferences(
  userId: string,
  preferences: {
    emailEnabled?: boolean
    emailFrequency?: 'immediate' | 'daily' | 'weekly' | 'monthly'
    announcements?: boolean
    events?: boolean
    payments?: boolean
    volunteer?: boolean
    meetings?: boolean
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const updateData = {
      user_id: userId,
      email_enabled: preferences.emailEnabled ?? false,
      email_frequency: preferences.emailFrequency ?? 'weekly',
      announcements_enabled: preferences.announcements ?? false,
      events_enabled: preferences.events ?? false,
      payments_enabled: preferences.payments ?? true,
      volunteer_enabled: preferences.volunteer ?? false,
      meetings_enabled: preferences.meetings ?? false,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('communication_preferences')
      .upsert(updateData, {
        onConflict: 'user_id',
      })

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('[Privacy] Error updating preferences:', error)
    return { success: false, error: 'Failed to update communication preferences' }
  }
}

export async function requestParentConsent(
  studentUserId: string,
  parentEmail: string,
  consentTypes: string[]
): Promise<{ success: boolean; consentToken?: string; error?: string }> {
  try {
    const consentPayload = {
      studentUserId,
      parentEmailHash: hashEmail(parentEmail),
      consentTypes,
      timestamp: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    }

    const consentToken = Buffer.from(JSON.stringify(consentPayload)).toString('base64url')

    return { success: true, consentToken }
  } catch (error) {
    console.error('[Privacy] Error generating consent token:', error)
    return { success: false, error: 'Failed to generate consent token' }
  }
}

export async function verifyParentConsent(
  token: string,
  ipAddress: string
): Promise<{ success: boolean; studentUserId?: string; error?: string }> {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64url').toString())
    
    if (Date.now() > payload.expiresAt) {
      return { success: false, error: 'Consent token has expired' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('communication_preferences')
      .update({
        parent_consent_verified: true,
        parent_consent_method: 'web_form',
        parent_consent_date: new Date().toISOString(),
        parent_consent_ip: ipAddress,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', payload.studentUserId)

    if (error) throw error

    return { success: true, studentUserId: payload.studentUserId }
  } catch (error) {
    console.error('[Privacy] Error verifying parent consent:', error)
    return { success: false, error: 'Failed to verify parent consent' }
  }
}