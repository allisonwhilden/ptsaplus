/**
 * Event RSVP API Route
 * 
 * POST /api/events/[id]/rsvp - Create or update RSVP for an event
 * DELETE /api/events/[id]/rsvp - Remove RSVP
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase-server';
import { rsvpSchema } from '@/lib/events/validation';
import { validateCapacity, validateGuestCount, canUserViewEvent } from '@/lib/events/validation';
import { RSVPRequest } from '@/lib/events/types';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { z } from 'zod';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'You must be logged in to RSVP' },
        { status: 401 }
      );
    }
    
    // Apply rate limiting for RSVP operations
    const rateLimitResponse = await rateLimit(request, RATE_LIMITS.rsvp, userId);
    if (rateLimitResponse) return rateLimitResponse;
    
    const { id: eventId } = await params;
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Get user's member info
    const { data: member } = await supabase
      .from('members')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();
    
    if (!member) {
      return NextResponse.json(
        { error: 'You must be a registered member to RSVP' },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body: RSVPRequest = await request.json();
    const validatedRsvp = rsvpSchema.parse(body);
    
    // Get event details
    const { data: event } = await supabase
      .from('events')
      .select('*, attending_count:event_rsvps!inner(count)')
      .eq('id', eventId)
      .single();
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    // Check if user can view this event
    if (!canUserViewEvent(event.visibility, member.role, true)) {
      return NextResponse.json(
        { error: 'You do not have permission to RSVP to this event' },
        { status: 403 }
      );
    }
    
    // Check if event requires RSVP
    if (!event.requires_rsvp) {
      return NextResponse.json(
        { error: 'This event does not require RSVP' },
        { status: 400 }
      );
    }
    
    // Check if event has already started
    if (new Date(event.start_time) < new Date()) {
      return NextResponse.json(
        { error: 'Cannot RSVP to an event that has already started' },
        { status: 400 }
      );
    }
    
    // Validate guest count
    if (!validateGuestCount(validatedRsvp.guest_count, event.allow_guests)) {
      return NextResponse.json(
        { error: event.allow_guests ? 'Invalid guest count (max 10)' : 'This event does not allow guests' },
        { status: 400 }
      );
    }
    
    // Check existing RSVP
    const { data: existingRsvp } = await supabase
      .from('event_rsvps')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();
    
    // If changing to attending, check capacity
    if (validatedRsvp.status === 'attending' && event.capacity) {
      const currentAttending = event.attending_count?.[0]?.count || 0;
      const previouslyAttending = existingRsvp?.status === 'attending' ? 1 + (existingRsvp.guest_count || 0) : 0;
      const newAttendees = 1 + validatedRsvp.guest_count;
      
      if (!validateCapacity(currentAttending - previouslyAttending, newAttendees, event.capacity)) {
        return NextResponse.json(
          { error: 'Event is full' },
          { status: 400 }
        );
      }
    }
    
    // Create or update RSVP
    const rsvpData = {
      event_id: eventId,
      user_id: userId,
      ...validatedRsvp,
      updated_at: new Date().toISOString(),
    };
    
    let result;
    if (existingRsvp) {
      // Update existing RSVP
      const { data, error } = await supabase
        .from('event_rsvps')
        .update(rsvpData)
        .eq('id', existingRsvp.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating RSVP:', error);
        return NextResponse.json(
          { error: 'Failed to update RSVP' },
          { status: 500 }
        );
      }
      
      result = data;
    } else {
      // Create new RSVP
      const { data, error } = await supabase
        .from('event_rsvps')
        .insert(rsvpData)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating RSVP:', error);
        return NextResponse.json(
          { error: 'Failed to create RSVP' },
          { status: 500 }
        );
      }
      
      result = data;
    }
    
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid RSVP data', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error in POST /api/events/[id]/rsvp:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    
    const { id: eventId } = await params;
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Delete RSVP
    const { error } = await supabase
      .from('event_rsvps')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting RSVP:', error);
      return NextResponse.json(
        { error: 'Failed to delete RSVP' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error in DELETE /api/events/[id]/rsvp:', error);
    return NextResponse.json(
      { error: 'Failed to delete RSVP' },
      { status: 500 }
    );
  }
}