/**
 * Admin Audit Logs Export API
 * GET /api/admin/audit-logs/export - Export audit logs as CSV (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/config/supabase';
import { logAuditEvent, AuditAction, exportAuditLogs } from '@/lib/privacy/audit';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    
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
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Log export action
    await logAuditEvent({
      userId,
      action: AuditAction.ADMIN_EXPORT,
      resourceType: 'audit_logs',
      metadata: { format: 'csv' },
    });

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters = {
      userId: searchParams.get('userId') || undefined,
      action: searchParams.get('action') || undefined,
      resourceType: searchParams.get('resourceType') || undefined,
    };

    // Set date range
    const days = parseInt(searchParams.get('days') || '30');
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Export as CSV
    const csv = await exportAuditLogs({
      ...filters,
      startDate,
      endDate,
    });

    const filename = `audit-logs-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Admin audit logs export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}