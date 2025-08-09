/**
 * Audit Logging Infrastructure
 * Comprehensive audit trail for FERPA/COPPA compliance
 */

import { createClient } from '@/config/supabase';
import { AuditAction, AuditLog } from './types';
import { headers } from 'next/headers';

// Re-export AuditAction so other modules can import it from here
export { AuditAction } from './types';

interface AuditContext {
  userId?: string;
  action: AuditAction | string;
  resourceType?: string;
  resourceId?: string;
  previousValue?: Record<string, any>;
  newValue?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Log an audit event
 * Captures user actions for compliance tracking
 */
export async function logAuditEvent(context: AuditContext): Promise<string | null> {
  try {
    const supabase = createClient();
    const headersList = await headers();
    
    // Extract request information
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] || 
                     headersList.get('x-real-ip') || 
                     'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';
    
    // Get session ID from cookies if available
    const sessionId = headersList.get('cookie')
      ?.split(';')
      .find((c: string) => c.trim().startsWith('session_id='))
      ?.split('=')[1] || undefined;

    // Log to database using the stored function
    const { data, error } = await supabase.rpc('log_audit_event', {
      p_user_id: context.userId || null,
      p_action: context.action,
      p_resource_type: context.resourceType || null,
      p_resource_id: context.resourceId || null,
      p_previous_value: context.previousValue || null,
      p_new_value: context.newValue || null,
      p_metadata: {
        ...context.metadata,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      },
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
      p_session_id: sessionId || null,
    });

    if (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw - audit logging should not break the application
      return null;
    }

    // Also log to console for immediate visibility
    console.log(JSON.stringify({
      event: 'audit',
      action: context.action,
      userId: context.userId,
      resourceType: context.resourceType,
      resourceId: context.resourceId,
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'privacy',
      environment: process.env.NODE_ENV,
    }));

    return data;
  } catch (error) {
    console.error('Audit logging error:', error);
    return null;
  }
}

/**
 * Middleware to automatically log API actions
 */
export function withAuditLogging<T extends (...args: any[]) => any>(
  action: AuditAction | string,
  resourceType: string,
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    const request = args[0] as Request;
    const resourceId = args[1]?.params?.id || undefined;
    
    // Log the action attempt
    await logAuditEvent({
      action: `${action}.attempted`,
      resourceType,
      resourceId,
      metadata: {
        method: request.method,
        url: request.url,
      },
    });

    try {
      const result = await handler(...args);
      
      // Log successful action
      await logAuditEvent({
        action: `${action}.success`,
        resourceType,
        resourceId,
        metadata: {
          method: request.method,
          url: request.url,
        },
      });

      return result;
    } catch (error) {
      // Log failed action
      await logAuditEvent({
        action: `${action}.failed`,
        resourceType,
        resourceId,
        metadata: {
          method: request.method,
          url: request.url,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }) as T;
}

/**
 * Query audit logs with filters
 */
export async function queryAuditLogs(
  filters: {
    userId?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }
): Promise<AuditLog[]> {
  const supabase = createClient();
  
  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.userId) {
    query = query.eq('user_id', filters.userId);
  }
  
  if (filters.action) {
    query = query.eq('action', filters.action);
  }
  
  if (filters.resourceType) {
    query = query.eq('resource_type', filters.resourceType);
  }
  
  if (filters.resourceId) {
    query = query.eq('resource_id', filters.resourceId);
  }
  
  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate.toISOString());
  }
  
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate.toISOString());
  }
  
  if (filters.limit) {
    query = query.limit(filters.limit);
  }
  
  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to query audit logs:', error);
    throw error;
  }

  return data.map(log => ({
    ...log,
    createdAt: new Date(log.created_at),
    previousValue: log.previous_value,
    newValue: log.new_value,
    ipAddress: log.ip_address,
    userAgent: log.user_agent,
    sessionId: log.session_id,
  }));
}

/**
 * Get audit log statistics
 */
export async function getAuditStatistics(
  startDate: Date,
  endDate: Date
): Promise<{
  totalEvents: number;
  uniqueUsers: number;
  actionBreakdown: Record<string, number>;
  resourceBreakdown: Record<string, number>;
}> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('audit_logs')
    .select('user_id, action, resource_type')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (error) {
    console.error('Failed to get audit statistics:', error);
    throw error;
  }

  const uniqueUsers = new Set(data.map(log => log.user_id).filter(Boolean));
  const actionBreakdown: Record<string, number> = {};
  const resourceBreakdown: Record<string, number> = {};

  data.forEach(log => {
    actionBreakdown[log.action] = (actionBreakdown[log.action] || 0) + 1;
    if (log.resource_type) {
      resourceBreakdown[log.resource_type] = (resourceBreakdown[log.resource_type] || 0) + 1;
    }
  });

  return {
    totalEvents: data.length,
    uniqueUsers: uniqueUsers.size,
    actionBreakdown,
    resourceBreakdown,
  };
}

/**
 * Export audit logs for compliance reporting
 */
export async function exportAuditLogs(
  filters: Parameters<typeof queryAuditLogs>[0]
): Promise<string> {
  const logs = await queryAuditLogs(filters);
  
  // Convert to CSV format
  const headers = [
    'Timestamp',
    'User ID',
    'Action',
    'Resource Type',
    'Resource ID',
    'IP Address',
    'User Agent',
  ];
  
  const rows = logs.map(log => [
    log.createdAt.toISOString(),
    log.userId || '',
    log.action,
    log.resourceType || '',
    log.resourceId || '',
    log.ipAddress || '',
    log.userAgent || '',
  ]);
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');
  
  return csv;
}