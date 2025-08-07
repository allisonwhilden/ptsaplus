/**
 * COPPA Age-Out Cron Job
 * Runs weekly to check for children who have turned 13
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { processCOPPAAgeOut } from '@/lib/privacy/retention';

export async function GET(request: NextRequest) {
  // Verify this is called by Vercel Cron
  const authHeader = headers().get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Checking for COPPA age-outs...');
    await processCOPPAAgeOut();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'COPPA age-out check completed'
    });
  } catch (error) {
    console.error('COPPA age-out cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}