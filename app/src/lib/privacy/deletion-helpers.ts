/**
 * Data Deletion Helper Functions
 * Utilities for verifying and managing data deletion
 */

import { createClient } from '@/config/supabase';

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