/**
 * Audit logging utility for sensitive operations
 * Based on CLAUDE.md security patterns
 */

import { createClient } from '@/lib/supabase-server'

export interface AuditEvent {
  type: string
  userId: string
  targetId?: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

/**
 * Log a security-sensitive operation to audit trail
 * This follows the comprehensive audit logging pattern from CLAUDE.md
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    // Log to console in structured format (for monitoring systems)
    console.log(JSON.stringify({
      event: event.type,
      userId: event.userId,
      targetId: event.targetId,
      timestamp: new Date().toISOString(),
      metadata: event.metadata,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      level: 'audit',
      service: 'communication',
      environment: process.env.NODE_ENV,
    }))

    // Also store in database for persistence
    const supabase = await createClient()
    
    await supabase.from('audit_logs').insert({
      event_type: event.type,
      user_id: event.userId,
      target_id: event.targetId,
      metadata: event.metadata || {},
      ip_address: event.ipAddress,
      user_agent: event.userAgent,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    // Audit logging should never break the main flow
    console.error('[Audit] Failed to log event:', error)
  }
}

/**
 * Audit event types for communication system
 */
export const AUDIT_EVENTS = {
  // Announcement operations
  ANNOUNCEMENT_CREATED: 'announcement.created',
  ANNOUNCEMENT_UPDATED: 'announcement.updated',
  ANNOUNCEMENT_DELETED: 'announcement.deleted',
  ANNOUNCEMENT_EMAIL_SENT: 'announcement.email_sent',
  
  // Communication preferences
  PREFERENCES_UPDATED: 'preferences.updated',
  UNSUBSCRIBE_REQUEST: 'unsubscribe.request',
  UNSUBSCRIBE_ALL: 'unsubscribe.all',
  RESUBSCRIBE: 'resubscribe',
  
  // Email operations
  EMAIL_SENT: 'email.sent',
  EMAIL_FAILED: 'email.failed',
  EMAIL_BOUNCED: 'email.bounced',
  EMAIL_COMPLAINT: 'email.complaint',
  
  // Privacy operations
  CONSENT_GIVEN: 'consent.given',
  CONSENT_WITHDRAWN: 'consent.withdrawn',
  DATA_EXPORT_REQUESTED: 'data.export_requested',
  DATA_DELETION_REQUESTED: 'data.deletion_requested',
} as const

/**
 * Extract client information from request
 */
export function extractClientInfo(request: Request): {
  ipAddress: string
  userAgent: string
} {
  return {
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  }
}

/**
 * Log announcement operation with full context
 */
export async function logAnnouncementOperation(
  type: keyof typeof AUDIT_EVENTS,
  userId: string,
  announcementId: string,
  request?: Request,
  metadata?: Record<string, any>
): Promise<void> {
  const clientInfo = request ? extractClientInfo(request) : {}
  
  await logAuditEvent({
    type: AUDIT_EVENTS[type],
    userId,
    targetId: announcementId,
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString(),
    },
    ...clientInfo,
  })
}

/**
 * Log communication preference changes
 */
export async function logPreferenceChange(
  userId: string,
  changes: Record<string, any>,
  request?: Request
): Promise<void> {
  const clientInfo = request ? extractClientInfo(request) : {}
  
  await logAuditEvent({
    type: AUDIT_EVENTS.PREFERENCES_UPDATED,
    userId,
    metadata: {
      changes,
      timestamp: new Date().toISOString(),
    },
    ...clientInfo,
  })
}

/**
 * Log unsubscribe operations
 */
export async function logUnsubscribeOperation(
  userId: string,
  category: string | null,
  request?: Request
): Promise<void> {
  const clientInfo = request ? extractClientInfo(request) : {}
  
  await logAuditEvent({
    type: category ? AUDIT_EVENTS.UNSUBSCRIBE_REQUEST : AUDIT_EVENTS.UNSUBSCRIBE_ALL,
    userId,
    metadata: {
      category,
      timestamp: new Date().toISOString(),
    },
    ...clientInfo,
  })
}

/**
 * Log email sending operations
 */
export async function logEmailOperation(
  type: 'sent' | 'failed' | 'bounced' | 'complaint',
  userId: string | null,
  emailDetails: {
    subject: string
    template?: string
    category?: string
    error?: string
  }
): Promise<void> {
  const eventType = {
    sent: AUDIT_EVENTS.EMAIL_SENT,
    failed: AUDIT_EVENTS.EMAIL_FAILED,
    bounced: AUDIT_EVENTS.EMAIL_BOUNCED,
    complaint: AUDIT_EVENTS.EMAIL_COMPLAINT,
  }[type]
  
  await logAuditEvent({
    type: eventType,
    userId: userId || 'system',
    metadata: {
      ...emailDetails,
      timestamp: new Date().toISOString(),
    },
  })
}