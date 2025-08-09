/**
 * Consent Management API
 * POST /api/privacy/consent - Record consent action
 * GET /api/privacy/consent - Get user's consent records
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/config/supabase';
import { logAuditEvent, AuditAction } from '@/lib/privacy/audit';
import { ConsentType, ConsentRecord } from '@/lib/privacy/types';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient();
    
    // Get consent type filter from query params
    const { searchParams } = new URL(request.url);
    const consentType = searchParams.get('type') as ConsentType | null;

    let query = supabase
      .from('consent_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (consentType) {
      query = query.eq('consent_type', consentType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching consent records:', error);
      return NextResponse.json(
        { error: 'Failed to fetch consent records' },
        { status: 500 }
      );
    }

    // Get the latest consent status for each type
    const latestConsents: Record<string, ConsentRecord> = {};
    data.forEach((record) => {
      if (!latestConsents[record.consent_type]) {
        latestConsents[record.consent_type] = record;
      }
    });

    return NextResponse.json({
      records: data,
      current: latestConsents,
    });
  } catch (error) {
    console.error('Consent GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { consentType, granted, parentUserId, consentVersion, metadata } = body;

    // Validate consent type
    const validConsentTypes: ConsentType[] = [
      'terms_of_service',
      'privacy_policy',
      'coppa_parental',
      'photo_sharing',
      'data_sharing',
      'email_communications',
      'directory_inclusion',
      'ai_features',
    ];

    if (!consentType || !validConsentTypes.includes(consentType)) {
      return NextResponse.json(
        { error: 'Invalid consent type' },
        { status: 400 }
      );
    }

    if (typeof granted !== 'boolean') {
      return NextResponse.json(
        { error: 'Granted must be a boolean' },
        { status: 400 }
      );
    }

    // For COPPA parental consent, verify parent relationship
    if (consentType === 'coppa_parental' && !parentUserId) {
      return NextResponse.json(
        { error: 'Parent user ID required for COPPA consent' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const headers = request.headers;
    
    // Get request metadata
    const ipAddress = headers.get('x-forwarded-for')?.split(',')[0] || 
                     headers.get('x-real-ip') || 
                     undefined;
    const userAgent = headers.get('user-agent') || undefined;

    // Record consent
    const { data, error } = await supabase
      .from('consent_records')
      .insert({
        user_id: userId,
        consent_type: consentType,
        granted,
        parent_user_id: parentUserId || null,
        consent_version: consentVersion || null,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: metadata || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording consent:', error);
      return NextResponse.json(
        { error: 'Failed to record consent' },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent({
      userId,
      action: granted ? AuditAction.CONSENT_GRANTED : AuditAction.CONSENT_REVOKED,
      resourceType: 'consent',
      resourceId: data.id,
      newValue: {
        consentType,
        granted,
        version: consentVersion,
      },
      metadata: {
        ...metadata,
        parentUserId,
      },
    });

    // Handle special cases based on consent type
    if (consentType === 'directory_inclusion' && !granted) {
      // Update privacy settings to hide from directory
      await supabase
        .from('privacy_settings')
        .update({ directory_visible: false })
        .eq('user_id', userId);
    }

    if (consentType === 'email_communications' && !granted) {
      // TODO: Update email preferences
    }

    return NextResponse.json({
      success: true,
      consent: data,
    });
  } catch (error) {
    console.error('Consent POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}