/**
 * Daily Maintenance Cron Job
 * Consolidates all daily maintenance tasks into a single cron to stay within Vercel hobby plan limits
 * Runs at 2 AM daily
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { runRetentionPolicies, cleanupTemporaryData } from '@/lib/privacy/retention';

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron job request from Vercel
    const authHeader = (await headers()).get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const results = {
      retention: { success: false, message: '' },
      tempCleanup: { success: false, message: '' },
      timestamp: new Date().toISOString()
    };

    // Task 1: Apply data retention policies
    try {
      const retentionResult = await runRetentionPolicies();
      const totalProcessed = retentionResult.results.reduce((sum, r) => sum + r.processed, 0);
      const totalErrors = retentionResult.results.reduce((sum, r) => sum + r.errors.length, 0);
      results.retention = {
        success: retentionResult.success,
        message: `Processed ${totalProcessed} items across ${retentionResult.results.length} policies, ${totalErrors} errors`
      };
    } catch (error) {
      console.error('Data retention error:', error);
      results.retention = {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Task 2: Clean up temporary data
    try {
      await cleanupTemporaryData();
      results.tempCleanup = {
        success: true,
        message: 'Temporary data cleaned successfully'
      };
    } catch (error) {
      console.error('Temp cleanup error:', error);
      results.tempCleanup = {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Log results
    console.log('Daily maintenance completed:', JSON.stringify(results, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Daily maintenance tasks completed',
      results
    });
  } catch (error) {
    console.error('Daily maintenance cron error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute daily maintenance tasks',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}