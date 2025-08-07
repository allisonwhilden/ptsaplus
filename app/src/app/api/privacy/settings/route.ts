/**
 * Privacy Settings API
 * GET /api/privacy/settings - Get current user's privacy settings
 * PUT /api/privacy/settings - Update privacy settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/config/supabase';
import { logAuditEvent, AuditAction } from '@/lib/privacy/audit';
import { PrivacySettings } from '@/lib/privacy/types';
import { withRateLimit } from '@/lib/privacy/rate-limit';

export async function GET(request: NextRequest) {
  const { userId } = auth();
  
  return withRateLimit(
    request,
    'privacySettingsRead',
    async () => {
      try {
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient();
    
    // Get privacy settings
    const { data, error } = await supabase
      .from('privacy_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching privacy settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch privacy settings' },
        { status: 500 }
      );
    }

    // If no settings exist, create default ones
    if (!data) {
      const { data: newSettings, error: createError } = await supabase
        .from('privacy_settings')
        .insert({
          user_id: userId,
          show_email: false,
          show_phone: false,
          show_address: false,
          show_children: false,
          directory_visible: true,
          allow_photo_sharing: false,
          allow_data_sharing: false,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating privacy settings:', createError);
        return NextResponse.json(
          { error: 'Failed to create privacy settings' },
          { status: 500 }
        );
      }

      await logAuditEvent({
        userId,
        action: AuditAction.PRIVACY_SETTINGS_UPDATE,
        resourceType: 'privacy_settings',
        resourceId: newSettings.id,
        newValue: newSettings,
        metadata: { reason: 'default_settings_created' },
      });

      return NextResponse.json(newSettings);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Privacy settings GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
    },
    userId
  );
}

export async function PUT(request: NextRequest) {
  const { userId } = auth();
  
  return withRateLimit(
    request,
    'privacySettingsUpdate',
    async () => {
      try {
        if (!userId) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }

        const body = await request.json();
    const supabase = createClient();

    // Validate input
    const allowedFields = [
      'show_email',
      'show_phone',
      'show_address',
      'show_children',
      'directory_visible',
      'allow_photo_sharing',
      'allow_data_sharing',
    ];

    const updates: Partial<PrivacySettings> = {};
    for (const field of allowedFields) {
      if (field in body && typeof body[field] === 'boolean') {
        updates[field as keyof PrivacySettings] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Get current settings for audit log
    const { data: currentSettings } = await supabase
      .from('privacy_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Update privacy settings
    const { data, error } = await supabase
      .from('privacy_settings')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      // If no row exists, create it
      if (error.code === 'PGRST116') {
        const { data: newSettings, error: createError } = await supabase
          .from('privacy_settings')
          .insert({
            user_id: userId,
            ...updates,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating privacy settings:', createError);
          return NextResponse.json(
            { error: 'Failed to create privacy settings' },
            { status: 500 }
          );
        }

        await logAuditEvent({
          userId,
          action: AuditAction.PRIVACY_SETTINGS_UPDATE,
          resourceType: 'privacy_settings',
          resourceId: newSettings.id,
          newValue: newSettings,
          metadata: { fields_updated: Object.keys(updates) },
        });

        return NextResponse.json(newSettings);
      }

      console.error('Error updating privacy settings:', error);
      return NextResponse.json(
        { error: 'Failed to update privacy settings' },
        { status: 500 }
      );
    }

    // Log the update
    await logAuditEvent({
      userId,
      action: AuditAction.PRIVACY_SETTINGS_UPDATE,
      resourceType: 'privacy_settings',
      resourceId: data.id,
      previousValue: currentSettings,
      newValue: data,
      metadata: { fields_updated: Object.keys(updates) },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Privacy settings PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
    },
    userId
  );
}