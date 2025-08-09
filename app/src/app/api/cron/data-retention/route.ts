/**
 * Data Retention Cron Job
 * Runs daily at 2 AM to clean up old data
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { runRetentionPolicies } from '@/lib/privacy/retention';

export async function GET(request: NextRequest) {
  // Verify this is called by Vercel Cron
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Starting data retention cleanup...');
    const result = await runRetentionPolicies();
    
    console.log('Data retention completed:', {
      success: result.success,
      processed: result.results.reduce((sum, r) => sum + r.processed, 0),
      errors: result.results.filter(r => r.errors.length > 0).length
    });

    return NextResponse.json({
      success: result.success,
      timestamp: new Date().toISOString(),
      results: result.results
    });
  } catch (error) {
    console.error('Data retention cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}