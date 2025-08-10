/**
 * Admin Audit Logs API
 * GET /api/admin/audit-logs - Get audit logs (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/config/supabase';
import { logAuditEvent, AuditAction, queryAuditLogs } from '@/lib/privacy/audit';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient();
    
    // Check if user is admin
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('role')
      .eq('clerk_id', userId)
      .single();

    if (memberError || !member || (member.role !== 'admin' && member.role !== 'board')) {
      await logAuditEvent({
        userId,
        action: AuditAction.ADMIN_ACCESS,
        resourceType: 'audit_logs',
        metadata: { unauthorized: true },
      });
      
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Log admin access
    await logAuditEvent({
      userId,
      action: AuditAction.ADMIN_ACCESS,
      resourceType: 'audit_logs',
    });

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters = {
      userId: searchParams.get('userId') || undefined,
      action: searchParams.get('action') || undefined,
      resourceType: searchParams.get('resourceType') || undefined,
      limit: parseInt(searchParams.get('limit') || '100'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    // Set date range to last 30 days by default
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const logs = await queryAuditLogs({
      ...filters,
      startDate,
      endDate,
    });

    return NextResponse.json({
      logs,
      total: logs.length,
      filters,
    });
  } catch (error) {
    console.error('Admin audit logs GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}