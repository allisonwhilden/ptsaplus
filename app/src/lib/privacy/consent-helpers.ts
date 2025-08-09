/**
 * Consent Helper Functions
 * Utilities for checking and managing user consents
 */

import { createClient } from '@/config/supabase';
import { ConsentType } from './types';

/**
 * Check if user has all required consents
 */
export async function checkRequiredConsents(
  userId: string,
  requiredTypes: ConsentType[]
): Promise<{
  hasAllConsents: boolean;
  missingConsents: ConsentType[];
  consents: Record<string, boolean>;
}> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('consent_records')
    .select('consent_type, granted')
    .eq('user_id', userId)
    .in('consent_type', requiredTypes)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error checking consents:', error);
    return {
      hasAllConsents: false,
      missingConsents: requiredTypes,
      consents: {},
    };
  }

  // Get latest consent for each type
  const consents: Record<string, boolean> = {};
  const processedTypes = new Set<string>();
  
  data.forEach((record) => {
    if (!processedTypes.has(record.consent_type)) {
      consents[record.consent_type] = record.granted;
      processedTypes.add(record.consent_type);
    }
  });

  // Check which consents are missing
  const missingConsents = requiredTypes.filter(
    type => !consents[type]
  );

  return {
    hasAllConsents: missingConsents.length === 0,
    missingConsents,
    consents,
  };
}