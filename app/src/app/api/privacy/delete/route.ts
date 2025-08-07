/**
 * Data Deletion API
 * POST /api/privacy/delete - Request account deletion
 * Implements GDPR/CCPA right to erasure with proper anonymization
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@/config/supabase';
import { logAuditEvent, AuditAction } from '@/lib/privacy/audit';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient();

    // Check for existing deletion request
    const { data: existingRequest } = await supabase
      .from('data_export_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('request_type', 'deletion')
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return NextResponse.json({
        message: 'Deletion request already pending',
        request: existingRequest,
      });
    }

    // Create deletion request
    const { data: deletionRequest, error } = await supabase
      .from('data_export_requests')
      .insert({
        user_id: userId,
        request_type: 'deletion',
        status: 'pending',
        metadata: {
          requested_at: new Date().toISOString(),
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        },
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating deletion request:', error);
      return NextResponse.json(
        { error: 'Failed to create deletion request' },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent({
      userId,
      action: AuditAction.DATA_DELETION_REQUESTED,
      resourceType: 'account',
      resourceId: userId,
      metadata: {
        request_id: deletionRequest.id,
      },
    });

    // Process deletion asynchronously
    processDeletion(userId, deletionRequest.id);

    return NextResponse.json({
      success: true,
      message: 'Account deletion requested. You will receive a confirmation email.',
      requestId: deletionRequest.id,
    });
  } catch (error) {
    console.error('Data deletion POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processDeletion(userId: string, requestId: string) {
  const supabase = createClient();

  try {
    // Update status to processing
    await supabase
      .from('data_export_requests')
      .update({ status: 'processing' })
      .eq('id', requestId);

    // Generate anonymized ID for audit trail
    const anonymizedId = `DELETED_${crypto.randomBytes(8).toString('hex')}`;

    // Start transaction-like deletion process
    // Note: Supabase doesn't support transactions via REST API, 
    // so we handle errors gracefully

    const deletionResults = {
      member: false,
      privacy_settings: false,
      consent_records: false,
      event_rsvps: false,
      volunteer_signups: false,
      child_accounts: false,
      payments_anonymized: false,
      clerk_deleted: false,
    };

    // 1. Anonymize member record (keep for financial/legal records)
    const { error: memberError } = await supabase
      .from('members')
      .update({
        email: `${anonymizedId}@deleted.local`,
        first_name: 'Deleted',
        last_name: 'User',
        phone: null,
        // Keep role and membership info for statistics
        clerk_id: anonymizedId, // Break link to Clerk
      })
      .eq('clerk_id', userId);

    if (!memberError) deletionResults.member = true;

    // 2. Delete privacy settings
    const { error: privacyError } = await supabase
      .from('privacy_settings')
      .delete()
      .eq('user_id', userId);

    if (!privacyError) deletionResults.privacy_settings = true;

    // 3. Anonymize consent records (keep for compliance)
    const { error: consentError } = await supabase
      .from('consent_records')
      .update({
        user_id: anonymizedId,
        ip_address: null,
        user_agent: null,
      })
      .eq('user_id', userId);

    if (!consentError) deletionResults.consent_records = true;

    // 4. Delete event RSVPs
    const { error: rsvpError } = await supabase
      .from('event_rsvps')
      .delete()
      .eq('user_id', userId);

    if (!rsvpError) deletionResults.event_rsvps = true;

    // 5. Delete volunteer signups
    const { error: volunteerError } = await supabase
      .from('volunteer_signups')
      .delete()
      .eq('user_id', userId);

    if (!volunteerError) deletionResults.volunteer_signups = true;

    // 6. Handle child accounts if user is a parent
    const { error: childError } = await supabase
      .from('child_accounts')
      .update({
        parent_user_id: anonymizedId,
      })
      .eq('parent_user_id', userId);

    if (!childError) deletionResults.child_accounts = true;

    // 7. Anonymize payment records (required for financial records)
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        user_id: anonymizedId,
        // Keep financial data for legal requirements
      })
      .eq('user_id', userId);

    if (!paymentError) deletionResults.payments_anonymized = true;

    // 8. Delete from Clerk
    try {
      await clerkClient.users.deleteUser(userId);
      deletionResults.clerk_deleted = true;
    } catch (clerkError) {
      console.error('Error deleting from Clerk:', clerkError);
    }

    // Log final audit event with anonymized ID
    await logAuditEvent({
      userId: anonymizedId,
      action: AuditAction.DATA_DELETION_COMPLETED,
      resourceType: 'account',
      resourceId: anonymizedId,
      metadata: {
        original_user_id_hash: crypto.createHash('sha256').update(userId).digest('hex'),
        deletion_results: deletionResults,
        deletion_date: new Date().toISOString(),
      },
    });

    // Update deletion request
    await supabase
      .from('data_export_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        metadata: {
          anonymized_id: anonymizedId,
          deletion_results: deletionResults,
        },
      })
      .eq('id', requestId);

    // TODO: Send confirmation email before account is fully deleted
  } catch (error) {
    console.error('Error processing deletion:', error);
    
    // Update status to failed
    await supabase
      .from('data_export_requests')
      .update({
        status: 'failed',
        metadata: { 
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      })
      .eq('id', requestId);
  }
}

/**
 * Verify deletion was successful
 * This can be called by admins to verify a user's data was properly deleted
 */
export async function verifyDeletion(originalUserId: string): Promise<{
  isDeleted: boolean;
  remainingData: string[];
}> {
  const supabase = createClient();
  const remainingData: string[] = [];

  // Check if original user ID still exists in members
  const { data: member } = await supabase
    .from('members')
    .select('clerk_id')
    .eq('clerk_id', originalUserId)
    .single();

  if (member) {
    remainingData.push('members');
  }

  // Check privacy settings
  const { data: privacy } = await supabase
    .from('privacy_settings')
    .select('id')
    .eq('user_id', originalUserId)
    .single();

  if (privacy) {
    remainingData.push('privacy_settings');
  }

  // Check event RSVPs
  const { data: rsvps } = await supabase
    .from('event_rsvps')
    .select('id')
    .eq('user_id', originalUserId)
    .limit(1);

  if (rsvps && rsvps.length > 0) {
    remainingData.push('event_rsvps');
  }

  // Check volunteer signups
  const { data: volunteers } = await supabase
    .from('volunteer_signups')
    .select('id')
    .eq('user_id', originalUserId)
    .limit(1);

  if (volunteers && volunteers.length > 0) {
    remainingData.push('volunteer_signups');
  }

  return {
    isDeleted: remainingData.length === 0,
    remainingData,
  };
}