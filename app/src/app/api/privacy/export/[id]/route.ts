/**
 * Data Export Download API
 * GET /api/privacy/export/[id] - Download a completed data export
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/config/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const supabase = createClient();

    // Get export request
    const { data: exportRequest, error } = await supabase
      .from('data_export_requests')
      .select('*')
      .eq('id', id)
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