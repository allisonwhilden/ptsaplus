/**
 * Data Export API
 * POST /api/privacy/export - Request data export
 * GET /api/privacy/export/[id] - Download exported data
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/config/supabase';
import { logAuditEvent, AuditAction } from '@/lib/privacy/audit';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient();

    // Check for existing pending export request
    const { data: existingRequest } = await supabase
      .from('data_export_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return NextResponse.json({
        message: 'Export request already pending',
        request: existingRequest,
      });
    }

    // Create new export request
    const { data: exportRequest, error } = await supabase
      .from('data_export_requests')
      .insert({
        user_id: userId,
        request_type: 'export',
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating export request:', error);
      return NextResponse.json(
        { error: 'Failed to create export request' },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent({
      userId,
      action: AuditAction.DATA_EXPORT_REQUESTED,
      resourceType: 'data_export',
      resourceId: exportRequest.id,
      metadata: {
        request_type: 'export',
      },
    });

    // Start async export process
    processDataExport(userId, exportRequest.id);

    return NextResponse.json({
      success: true,
      message: 'Export request created. You will be notified when ready.',
      requestId: exportRequest.id,
    });
  } catch (error) {
    console.error('Data export POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processDataExport(userId: string, requestId: string) {
  const supabase = createClient();

  try {
    // Update status to processing
    await supabase
      .from('data_export_requests')
      .update({ status: 'processing' })
      .eq('id', requestId);

    // Gather all user data
    const userData = await gatherUserData(userId);

    // Convert to JSON format
    const exportData = {
      export_date: new Date().toISOString(),
      user_id: userId,
      data: userData,
    };

    // In a real implementation, this would:
    // 1. Store the file in secure storage (S3, etc.)
    // 2. Generate a signed URL for download
    // 3. Send email notification to user
    // For now, we'll store as JSONB in the database

    const exportUrl = `/api/privacy/export/${requestId}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expire in 7 days

    // Update request with completion
    await supabase
      .from('data_export_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        export_url: exportUrl,
        expires_at: expiresAt.toISOString(),
        metadata: exportData,
      })
      .eq('id', requestId);

    // Log audit event
    await logAuditEvent({
      userId,
      action: AuditAction.DATA_EXPORT_COMPLETED,
      resourceType: 'data_export',
      resourceId: requestId,
      metadata: {
        data_categories: Object.keys(userData),
      },
    });

    // TODO: Send email notification to user
  } catch (error) {
    console.error('Error processing data export:', error);
    
    // Update status to failed
    await supabase
      .from('data_export_requests')
      .update({
        status: 'failed',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      })
      .eq('id', requestId);
  }
}

async function gatherUserData(userId: string) {
  const supabase = createClient();
  const userData: Record<string, any> = {};

  // Get member profile
  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('clerk_id', userId)
    .single();

  if (member) {
    userData.profile = {
      ...member,
      // Remove sensitive internal fields
      id: undefined,
      clerk_id: undefined,
    };
  }

  // Get privacy settings
  const { data: privacySettings } = await supabase
    .from('privacy_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (privacySettings) {
    userData.privacy_settings = privacySettings;
  }

  // Get consent records
  const { data: consents } = await supabase
    .from('consent_records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (consents) {
    userData.consent_history = consents;
  }

  // Get event registrations
  const { data: rsvps } = await supabase
    .from('event_rsvps')
    .select(`
      *,
      events (
        title,
        date,
        location,
        event_type
      )
    `)
    .eq('user_id', userId);

  if (rsvps) {
    userData.event_registrations = rsvps;
  }

  // Get volunteer signups
  const { data: volunteerSignups } = await supabase
    .from('volunteer_signups')
    .select(`
      *,
      volunteer_slots (
        title,
        event_id
      )
    `)
    .eq('user_id', userId);

  if (volunteerSignups) {
    userData.volunteer_history = volunteerSignups;
  }

  // Get payment history
  const { data: payments } = await supabase
    .from('payments')
    .select('amount, currency, status, description, created_at')
    .eq('user_id', userId);

  if (payments) {
    userData.payment_history = payments.map(p => ({
      ...p,
      // Remove sensitive payment details
      stripe_payment_intent_id: undefined,
      stripe_customer_id: undefined,
    }));
  }

  // Get audit logs for user's own actions
  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select('action, resource_type, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (auditLogs) {
    userData.activity_log = auditLogs;
  }

  return userData;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient();

    // Get export request
    const { data: exportRequest, error } = await supabase
      .from('data_export_requests')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', userId)
      .single();

    if (error || !exportRequest) {
      return NextResponse.json(
        { error: 'Export request not found' },
        { status: 404 }
      );
    }

    if (exportRequest.status !== 'completed') {
      return NextResponse.json(
        { error: 'Export not ready yet' },
        { status: 202 }
      );
    }

    // Check if expired
    if (new Date(exportRequest.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Export link has expired' },
        { status: 410 }
      );
    }

    // Return the exported data
    const exportData = exportRequest.metadata;

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="ptsa-data-export-${userId}-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Data export GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}