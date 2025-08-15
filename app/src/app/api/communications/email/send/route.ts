import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabaseServiceClient } from '@/lib/supabase-server'
import { z } from 'zod'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/email/client'
import { queueEmail } from '@/lib/email/queue'
import { checkEmailConsent } from '@/lib/email/privacy'
import { logAuditEvent } from '@/lib/audit-logger'
import { renderEmailTemplate } from '@/lib/email/render-template'

const sendEmailSchema = z.object({
  template: z.string().min(1),
  audience: z.enum(['all', 'board', 'committee_chairs', 'teachers', 'custom']),
  customRecipients: z.array(z.string()).optional(),
  subject: z.string().min(1).max(200),
  scheduledFor: z.string().datetime().optional(),
  templateData: z.record(z.string(), z.any()).optional(),
})

export async function POST(request: NextRequest) {
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
    const { data: member } = await supabase
      .from('members')
      .select('*')
      .eq('clerk_id', userId)
      .single()

    if (!member || !['admin', 'board'].includes(member.role)) {
      return NextResponse.json(
        { error: 'Unauthorized to send emails' },
        { status: 403 }
      )
    }
    
    // Apply rate limiting
    const rateLimitResponse = await rateLimit(request, RATE_LIMITS.emails, userId)
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const validation = sendEmailSchema.safeParse(body)

    if (!validation.success) {
      console.error('[API] Validation error:', validation.error.issues)
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    const { template, audience, customRecipients, subject, scheduledFor, templateData } = validation.data

    // Get recipients based on audience
    let recipients: any[] = []
    
    if (audience === 'custom' && customRecipients) {
      const { data } = await supabase
        .from('members')
        .select('*')
        .in('id', customRecipients)
      recipients = data || []
    } else if (audience === 'all') {
      const { data } = await supabase
        .from('members')
        .select('*')
      recipients = data || []
    } else if (audience === 'board') {
      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('role', 'board')
      recipients = data || []
    } else if (audience === 'committee_chairs') {
      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('role', 'committee_chair')
      recipients = data || []
    } else if (audience === 'teachers') {
      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('role', 'teacher')
      recipients = data || []
    }

    // Filter recipients by consent
    const consentedRecipients = []
    for (const recipient of recipients) {
      const hasConsent = await checkEmailConsent(recipient.id, 'announcements')
      if (hasConsent) {
        consentedRecipients.push(recipient)
      }
    }

    if (consentedRecipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients with email consent found' },
        { status: 400 }
      )
    }

    // Queue or send emails
    const scheduledDate = scheduledFor ? new Date(scheduledFor) : null
    let queuedCount = 0

    if (scheduledDate && scheduledDate > new Date()) {
      // Schedule for later
      for (const recipient of consentedRecipients) {
        // Render the email template with recipient data
        const { html, text } = await renderEmailTemplate(template, {
          ...templateData,
          firstName: recipient.first_name,
          lastName: recipient.last_name,
          memberName: `${recipient.first_name} ${recipient.last_name}`,
          loginEmail: recipient.email,
        })
        
        await queueEmail({
          to: recipient.email,
          subject,
          html,
          text,
          scheduledFor: scheduledDate,
        })
        queuedCount++
      }
    } else {
      // Send immediately
      for (const recipient of consentedRecipients) {
        try {
          // Render the email template with recipient data
          const { html, text } = await renderEmailTemplate(template, {
            ...templateData,
            firstName: recipient.first_name,
            lastName: recipient.last_name,
            memberName: `${recipient.first_name} ${recipient.last_name}`,
            loginEmail: recipient.email,
          })
          
          await sendEmail({
            to: recipient.email,
            subject,
            html,
            text,
            template,
            userId: recipient.id,
            category: 'announcements',
          })
          queuedCount++
        } catch (error) {
          console.error(`Failed to send email to ${recipient.email}:`, error)
        }
      }
    }

    // Log the email send operation
    await logAuditEvent({
      type: 'email.sent',
      userId,
      targetId: `${template}_${Date.now()}`,
      metadata: {
        template,
        audience,
        recipientCount: queuedCount,
        scheduled: !!scheduledDate,
      },
    })

    // Create email log entry
    await supabase.from('email_logs').insert({
      template_type: template,
      subject,
      recipient_count: queuedCount,
      status: scheduledDate ? 'scheduled' : 'sent',
      sent_at: scheduledDate || new Date().toISOString(),
      sent_by: userId,
      metadata: {
        audience,
        templateData,
      },
    })

    return NextResponse.json({ 
      success: true,
      queuedCount,
      scheduled: !!scheduledDate,
    })
  } catch (error) {
    console.error('[API] Failed to send email:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}