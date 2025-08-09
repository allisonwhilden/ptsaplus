/**
 * Data Retention Automation
 * Implements automated data cleanup based on retention policies
 */

import { createClient } from '@/config/supabase';
import { logAuditEvent } from './audit';
import { encryptField } from './encryption';
// Note: We use Vercel crons instead of node-cron for serverless compatibility

// Retention periods in days
export const RETENTION_PERIODS = {
  // Active data
  active_member: -1, // Keep indefinitely while active
  
  // Inactive data
  inactive_member: 365, // 1 year after membership expires
  event_registration: 730, // 2 years after event
  volunteer_records: 1095, // 3 years
  
  // Financial records (legal requirement)
  payment_records: 2555, // 7 years
  donation_records: 2555, // 7 years
  
  // Compliance records
  audit_logs: 1095, // 3 years
  consent_records: 1095, // 3 years
  
  // Temporary data
  email_verification: 7,
  password_reset: 1,
  session_data: 30,
  export_files: 7,
  
  // Child accounts
  child_data_after_13: 30, // 30 days after turning 13 to transfer to regular account
};

interface RetentionPolicy {
  table: string;
  dateField: string;
  retentionDays: number;
  action: 'delete' | 'anonymize' | 'archive';
  condition?: Record<string, any>;
  description: string;
}

// Define retention policies for each data type
const RETENTION_POLICIES: RetentionPolicy[] = [
  {
    table: 'members',
    dateField: 'membership_expires_at',
    retentionDays: RETENTION_PERIODS.inactive_member,
    action: 'anonymize',
    condition: { membership_status: 'expired' },
    description: 'Anonymize expired member records after 1 year'
  },
  {
    table: 'event_rsvps',
    dateField: 'created_at',
    retentionDays: RETENTION_PERIODS.event_registration,
    action: 'delete',
    description: 'Delete old event registrations after 2 years'
  },
  {
    table: 'volunteer_signups',
    dateField: 'created_at',
    retentionDays: RETENTION_PERIODS.volunteer_records,
    action: 'archive',
    description: 'Archive volunteer records after 3 years'
  },
  {
    table: 'audit_logs',
    dateField: 'created_at',
    retentionDays: RETENTION_PERIODS.audit_logs,
    action: 'archive',
    description: 'Archive audit logs after 3 years'
  },
  {
    table: 'data_export_requests',
    dateField: 'expires_at',
    retentionDays: 0, // Check expiration date directly
    action: 'delete',
    condition: { status: 'completed' },
    description: 'Delete expired export files'
  }
];

/**
 * Process data retention for a specific policy
 */
async function processRetentionPolicy(policy: RetentionPolicy): Promise<{
  processed: number;
  errors: string[];
}> {
  const supabase = createClient();
  const errors: string[] = [];
  let processed = 0;

  try {
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

    // Build query based on action
    switch (policy.action) {
      case 'delete':
        const deleteQuery = supabase
          .from(policy.table)
          .delete()
          .lt(policy.dateField, cutoffDate.toISOString());

        if (policy.condition) {
          // Add custom condition if specified
          const { count, error } = await supabase
            .from(policy.table)
            .delete()
            .lt(policy.dateField, cutoffDate.toISOString())
            .match(policy.condition)
            .select('count');

          if (error) throw error;
          processed = count || 0;
        } else {
          const { count, error } = await deleteQuery.select('count');
          if (error) throw error;
          processed = count || 0;
        }
        break;

      case 'anonymize':
        // Fetch records to anonymize
        const { data: recordsToAnonymize, error: fetchError } = await supabase
          .from(policy.table)
          .select('*')
          .lt(policy.dateField, cutoffDate.toISOString())
          .limit(100); // Process in batches

        if (fetchError) throw fetchError;

        for (const record of recordsToAnonymize || []) {
          const anonymizedData = anonymizeRecord(record, policy.table);
          
          const { error: updateError } = await supabase
            .from(policy.table)
            .update(anonymizedData)
            .eq('id', record.id);

          if (updateError) {
            errors.push(`Failed to anonymize record ${record.id}: ${updateError.message}`);
          } else {
            processed++;
          }
        }
        break;

      case 'archive':
        // Move to archive table
        const archiveTableName = `${policy.table}_archive`;
        
        // First, copy records to archive
        const { data: recordsToArchive, error: archiveFetchError } = await supabase
          .from(policy.table)
          .select('*')
          .lt(policy.dateField, cutoffDate.toISOString())
          .limit(100);

        if (archiveFetchError) throw archiveFetchError;

        for (const record of recordsToArchive || []) {
          // Add archive metadata
          const archivedRecord = {
            ...record,
            archived_at: new Date().toISOString(),
            archive_reason: 'retention_policy'
          };

          // Insert into archive table
          const { error: archiveError } = await supabase
            .from(archiveTableName)
            .insert(archivedRecord);

          if (archiveError) {
            // Archive table might not exist, log error
            errors.push(`Failed to archive record ${record.id}: ${archiveError.message}`);
          } else {
            // Delete from main table
            const { error: deleteError } = await supabase
              .from(policy.table)
              .delete()
              .eq('id', record.id);

            if (deleteError) {
              errors.push(`Failed to delete archived record ${record.id}: ${deleteError.message}`);
            } else {
              processed++;
            }
          }
        }
        break;
    }

    // Log retention action
    await logAuditEvent({
      action: `retention.${policy.action}`,
      resourceType: policy.table,
      metadata: {
        policy: policy.description,
        records_processed: processed,
        cutoff_date: cutoffDate.toISOString(),
        errors: errors.length
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Policy processing failed: ${errorMessage}`);
  }

  return { processed, errors };
}

/**
 * Anonymize a record based on table type
 */
function anonymizeRecord(record: any, tableName: string): any {
  const anonymizedId = `ANON_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  switch (tableName) {
    case 'members':
      return {
        email: `${anonymizedId}@anonymized.local`,
        first_name: 'Anonymized',
        last_name: 'User',
        phone: null,
        clerk_id: anonymizedId,
        // Preserve non-PII fields for statistics
        role: record.role,
        membership_type: record.membership_type,
        joined_at: record.joined_at
      };

    case 'payments':
      return {
        user_id: anonymizedId,
        // Keep financial data for accounting
        amount: record.amount,
        status: record.status,
        created_at: record.created_at,
        // Remove PII
        stripe_customer_id: null,
        stripe_payment_intent_id: null,
        metadata: { anonymized: true }
      };

    default:
      // Generic anonymization
      return {
        ...record,
        user_id: anonymizedId,
        email: null,
        name: null,
        phone: null,
        address: null,
        ip_address: null,
        user_agent: null
      };
  }
}

/**
 * Run all retention policies
 */
export async function runRetentionPolicies(): Promise<{
  success: boolean;
  results: Array<{
    policy: string;
    processed: number;
    errors: string[];
  }>;
}> {
  const results = [];
  let allSuccess = true;

  for (const policy of RETENTION_POLICIES) {
    const result = await processRetentionPolicy(policy);
    results.push({
      policy: policy.description,
      processed: result.processed,
      errors: result.errors
    });

    if (result.errors.length > 0) {
      allSuccess = false;
    }
  }

  // Send summary notification to admins
  if (!allSuccess) {
    await notifyAdminsOfRetentionErrors(results);
  }

  return { success: allSuccess, results };
}

/**
 * Check for COPPA age-out (children turning 13)
 */
export async function processCOPPAAgeOut(): Promise<void> {
  const supabase = createClient();
  
  // Find children who have turned 13
  const thirteenYearsAgo = new Date();
  thirteenYearsAgo.setFullYear(thirteenYearsAgo.getFullYear() - 13);

  const { data: agedOutChildren, error } = await supabase
    .from('child_accounts')
    .select('*')
    .lt('birth_date', thirteenYearsAgo.toISOString())
    .eq('parental_consent_given', true);

  if (error) {
    console.error('Error checking COPPA age-out:', error);
    return;
  }

  for (const child of agedOutChildren || []) {
    // Convert to regular account
    await convertChildToRegularAccount(child.child_user_id);
    
    // Notify parent and child
    await sendCOPPAAgeOutNotification(child.child_user_id, child.parent_user_id);
    
    // Log the transition
    await logAuditEvent({
      userId: child.child_user_id,
      action: 'coppa.age_out',
      resourceType: 'child_account',
      resourceId: child.id,
      metadata: {
        birth_date: child.birth_date,
        transition_date: new Date().toISOString()
      }
    });
  }
}

/**
 * Convert child account to regular account
 */
async function convertChildToRegularAccount(childUserId: string): Promise<void> {
  const supabase = createClient();
  
  // Remove restrictions
  await supabase
    .from('privacy_settings')
    .update({
      allow_data_sharing: true,
      allow_photo_sharing: true,
      directory_visible: true
    })
    .eq('user_id', childUserId);

  // Archive child account record
  const { data: childAccount } = await supabase
    .from('child_accounts')
    .select('*')
    .eq('child_user_id', childUserId)
    .single();

  if (childAccount) {
    // Archive the record
    await supabase
      .from('child_accounts_archive')
      .insert({
        ...childAccount,
        archived_at: new Date().toISOString(),
        archive_reason: 'aged_out'
      });

    // Delete from active table
    await supabase
      .from('child_accounts')
      .delete()
      .eq('child_user_id', childUserId);
  }
}

/**
 * Schedule retention jobs using Vercel crons
 * Note: These are configured in vercel.json and executed via API routes
 * - /api/cron/data-retention - Daily at 2 AM
 * - /api/cron/coppa-age-out - Weekly on Sunday at 3 AM  
 * - /api/cron/temp-cleanup - Daily at 4 AM (limited by Vercel hobby plan)
 */
export function scheduleRetentionJobs(): void {
  // Vercel crons are configured in vercel.json
  // This function is kept for documentation purposes
  console.log('Retention jobs are scheduled via Vercel crons');
}

/**
 * Clean up temporary data
 */
async function cleanupTemporaryData(): Promise<void> {
  const supabase = createClient();
  
  // Clean expired sessions
  const sessionCutoff = new Date();
  sessionCutoff.setDate(sessionCutoff.getDate() - RETENTION_PERIODS.session_data);
  
  // Clean expired password reset tokens
  const resetCutoff = new Date();
  resetCutoff.setDate(resetCutoff.getDate() - RETENTION_PERIODS.password_reset);
  
  // Clean expired export files
  await supabase
    .from('data_export_requests')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .eq('status', 'completed');
}

/**
 * Get retention status for reporting
 */
export async function getRetentionStatus(): Promise<{
  policies: RetentionPolicy[];
  nextRun: Date;
  lastRun?: Date;
  stats: {
    table: string;
    totalRecords: number;
    recordsToProcess: number;
  }[];
}> {
  const supabase = createClient();
  const stats = [];

  for (const policy of RETENTION_POLICIES) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

    // Get counts
    const { count: total } = await supabase
      .from(policy.table)
      .select('count');

    const { count: toProcess } = await supabase
      .from(policy.table)
      .select('count')
      .lt(policy.dateField, cutoffDate.toISOString());

    stats.push({
      table: policy.table,
      totalRecords: total || 0,
      recordsToProcess: toProcess || 0
    });
  }

  // Calculate next run (2 AM tomorrow)
  const nextRun = new Date();
  nextRun.setDate(nextRun.getDate() + 1);
  nextRun.setHours(2, 0, 0, 0);

  return {
    policies: RETENTION_POLICIES,
    nextRun,
    stats
  };
}

// Notification helpers (implement based on your notification system)
async function notifyAdminsOfRetentionErrors(results: any[]): Promise<void> {
  // Implementation would depend on your notification system
  console.error('Retention policy errors:', results);
}

async function sendCOPPAAgeOutNotification(childUserId: string, parentUserId: string): Promise<void> {
  // Implementation would depend on your notification system
  console.log(`COPPA age-out notification: Child ${childUserId} has turned 13`);
}