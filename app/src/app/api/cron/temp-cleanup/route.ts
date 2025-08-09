/**
 * Temporary Data Cleanup Cron Job
 * Runs hourly to clean up temporary data
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@/config/supabase';

export async function GET(request: NextRequest) {
  // Verify this is called by Vercel Cron
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Starting temporary data cleanup...');
    const supabase = createClient();
    
    // Clean expired export files (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { error: exportError } = await supabase
      .from('data_export_requests')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .eq('status', 'completed');

    if (exportError) {
      console.error('Error cleaning export files:', exportError);
    }

    // Add other temporary data cleanup here as needed
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Temporary data cleanup completed'
    });
  } catch (error) {
    console.error('Temp cleanup cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}