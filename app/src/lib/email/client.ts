import { Resend } from 'resend'
import { EmailOptions } from './types'
import { 
  logEmailSecure, 
  generateUnsubscribeToken, 
  checkEmailConsent,
  getUserEmailSecure
} from './privacy'
import { createClient } from '@/lib/supabase-server'

const resendApiKey = process.env.RESEND_API_KEY

// Only throw error at runtime, not during build
let resend: Resend | null = null

if (resendApiKey) {
  resend = new Resend(resendApiKey)
} else if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
  // Log warning but don't throw during build
  console.warn('[Email] RESEND_API_KEY not configured - email sending disabled')
}

export { resend }

const FROM_EMAIL = process.env.EMAIL_FROM || 'PTSA+ <notifications@ptsaplus.org>'
const REPLY_TO_EMAIL = process.env.EMAIL_REPLY_TO || 'support@ptsaplus.org'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://ptsaplus.vercel.app'

export async function sendEmailToUser(
  userId: string,
  options: Omit<EmailOptions, 'to'> & { 
    category: 'announcements' | 'events' | 'payments' | 'volunteer' | 'meetings'
    template?: string
  }
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const consentCheck = await checkEmailConsent(userId, options.category)
    if (!consentCheck.canSend) {
      console.log(`[Email] Cannot send to user ${userId}: ${consentCheck.reason}`)
      return { success: false, error: consentCheck.reason }
    }

    const email = await getUserEmailSecure(userId)
    if (!email) {
      return { success: false, error: 'User email not found' }
    }

    return await sendEmail({
      ...options,
      to: email,
      userId,
      category: options.category,
    })
  } catch (error) {
    console.error('[Email] Failed to send email to user:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    }
  }
}

export async function sendEmail(
  options: EmailOptions & { 
    userId?: string
    category?: 'announcements' | 'events' | 'payments' | 'volunteer' | 'meetings'
    template?: string
  }
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const recipient = Array.isArray(options.to) ? options.to[0] : options.to
    
    if (!resend) {
      console.log('[Email] Skipping email send in development (no RESEND_API_KEY)')
      console.log('[Email] Would send to:', recipient)
      console.log('[Email] Subject:', options.subject)
      return { success: true, data: { id: 'dev-' + Date.now() } }
    }

    const unsubscribeToken = options.userId 
      ? generateUnsubscribeToken(options.userId, recipient)
      : null

    const unsubscribeUrl = unsubscribeToken
      ? `${BASE_URL}/unsubscribe?token=${unsubscribeToken}${options.category ? `&category=${options.category}` : ''}`
      : null

    const headers: Record<string, string> = {}
    if (unsubscribeUrl) {
      headers['List-Unsubscribe'] = `<${unsubscribeUrl}>`
      headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'
    }

    const emailOptions = {
      from: options.from || FROM_EMAIL,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html ? appendUnsubscribeLink(options.html, unsubscribeUrl, options.category) : undefined,
      text: options.text ? appendUnsubscribeText(options.text, unsubscribeUrl, options.category) : undefined,
      react: options.react,
      replyTo: REPLY_TO_EMAIL,
      tags: options.tags,
      headers,
    }

    const data = await resend.emails.send(emailOptions as any)

    await logEmailSecure({
      userId: options.userId,
      email: recipient,
      subject: options.subject,
      template: options.template,
      category: options.category,
      status: 'sent',
      metadata: {
        resendId: data.data?.id,
        tags: options.tags,
        ...options.metadata,
      },
    })

    return { success: true, data: data.data }
  } catch (error) {
    console.error('[Email] Failed to send email:', error)
    
    const recipient = Array.isArray(options.to) ? options.to[0] : options.to
    await logEmailSecure({
      userId: options.userId,
      email: recipient,
      subject: options.subject,
      template: options.template,
      category: options.category,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: options.metadata,
    })

    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    }
  }
}

export async function sendBulkEmailsSecure(
  userIds: string[],
  category: 'announcements' | 'events' | 'payments' | 'volunteer' | 'meetings',
  subject: string,
  template: React.ReactElement | ((userId: string, email: string) => React.ReactElement),
  templateName?: string
): Promise<{ 
  success: boolean
  queued: number
  blocked: number
  errors: Array<{ userId: string; reason: string }> 
}> {
  const results = { 
    queued: 0, 
    blocked: 0, 
    errors: [] as Array<{ userId: string; reason: string }> 
  }

  if (!resend) {
    console.log('[Email] Skipping bulk email send in development')
    return { success: true, queued: userIds.length, blocked: 0, errors: [] }
  }

  const supabase = await createClient()

  for (const userId of userIds) {
    try {
      const consentCheck = await checkEmailConsent(userId, category)
      
      if (!consentCheck.canSend) {
        results.blocked++
        results.errors.push({ userId, reason: consentCheck.reason || 'Consent denied' })
        continue
      }

      const email = await getUserEmailSecure(userId)
      if (!email) {
        results.blocked++
        results.errors.push({ userId, reason: 'Email not found' })
        continue
      }

      const emailTemplate = typeof template === 'function' 
        ? template(userId, email) 
        : template

      const result = await sendEmail({
        to: email,
        userId,
        subject,
        react: emailTemplate,
        category,
        template: templateName,
      })

      if (result.success) {
        results.queued++
      } else {
        results.errors.push({ userId, reason: result.error || 'Send failed' })
      }
    } catch (error) {
      results.errors.push({ 
        userId, 
        reason: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  }

  await logBulkEmailAttempt({
    category,
    template: templateName || 'custom',
    targetCount: userIds.length,
    queuedCount: results.queued,
    blockedCount: results.blocked,
  })

  return { 
    success: results.errors.length === 0, 
    ...results 
  }
}

async function logBulkEmailAttempt(data: {
  category: string
  template: string
  targetCount: number
  queuedCount: number
  blockedCount: number
}): Promise<void> {
  try {
    console.log('[Email] Bulk email attempt:', data)
  } catch (error) {
    console.error('[Email] Failed to log bulk email attempt:', error)
  }
}

function appendUnsubscribeLink(
  html: string, 
  unsubscribeUrl: string | null,
  category?: string
): string {
  if (!unsubscribeUrl) return html
  
  const categoryText = category 
    ? `${category} emails` 
    : 'these emails'
  
  const unsubscribeHtml = `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center; font-size: 12px; color: #666;">
      <p>You're receiving this email because you're a member of PTSA+.</p>
      <p>
        <a href="${unsubscribeUrl}" style="color: #0066cc; text-decoration: underline;">
          Unsubscribe from ${categoryText}
        </a>
      </p>
    </div>
  `
  
  if (html.includes('</body>')) {
    return html.replace('</body>', `${unsubscribeHtml}</body>`)
  }
  
  return html + unsubscribeHtml
}

function appendUnsubscribeText(
  text: string, 
  unsubscribeUrl: string | null,
  category?: string
): string {
  if (!unsubscribeUrl) return text
  
  const categoryText = category 
    ? `${category} emails` 
    : 'these emails'
  
  return text + `\n\n---\nYou're receiving this email because you're a member of PTSA+.\nUnsubscribe from ${categoryText}: ${unsubscribeUrl}`
}

export async function getEmailLogsSecure(
  filters?: {
    userId?: string
    emailHash?: string
    status?: 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'complained'
    startDate?: Date
    endDate?: Date
  }
): Promise<Array<{
  id: string
  userId?: string
  recipientDomain: string
  subject: string
  template?: string
  category?: string
  status: string
  sentAt?: Date
  createdAt: Date
}>> {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('email_logs')
      .select('id, user_id, recipient_domain, subject, template, category, status, sent_at, created_at')
      .order('created_at', { ascending: false })

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId)
    }
    if (filters?.emailHash) {
      query = query.eq('recipient_hash', filters.emailHash)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString())
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString())
    }

    const { data, error } = await query

    if (error) throw error
    
    return data?.map(log => ({
      id: log.id,
      userId: log.user_id,
      recipientDomain: log.recipient_domain,
      subject: log.subject,
      template: log.template,
      category: log.category,
      status: log.status,
      sentAt: log.sent_at ? new Date(log.sent_at) : undefined,
      createdAt: new Date(log.created_at),
    })) || []
  } catch (error) {
    console.error('[Email] Failed to get email logs:', error)
    return []
  }
}