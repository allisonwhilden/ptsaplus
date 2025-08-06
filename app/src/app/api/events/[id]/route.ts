/**
 * Individual Event API Routes
 * 
 * GET /api/events/[id] - Get event details
 * PUT /api/events/[id] - Update event (board/admin/creator only)
 * DELETE /api/events/[id] - Delete event (board/admin/creator only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase-server';
import { eventFormSchema } from '@/lib/events/validation';
import { canUserViewEvent, canUserEditEvent, canUserViewAttendees } from '@/lib/events/validation';
import { EventDetails, UpdateEventRequest } from '@/lib/events/types';
import { z } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id: eventId } = await params;
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Get user role if authenticated
    let userRole = null;
    if (userId) {
      const { data: member } = await supabase
        .from('members')
        .select('role')
        .eq('clerk_id', userId)
        .single();
      
      userRole = member?.role;
    }
    
    // Get event with counts
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        rsvp_count:event_rsvps(count),
        attending_count:event_rsvps!inner(count),
        volunteer_slots:event_volunteer_slots(
          *,
          signups:event_volunteer_signups(*)
        )
      `)
      .eq('id', eventId)
      .single();
    
    if (error || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    // Check if user can view this event
    if (!canUserViewEvent(event.visibility, userRole, !!userId)) {
      return NextResponse.json(
        { error: 'You do not have permission to view this event' },
        { status: 403 }
      );
    }
    
    // Get user's RSVP if authenticated
    let userRsvp = null;
    if (userId) {
      const { data: rsvp } = await supabase
        .from('event_rsvps')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();
      
      userRsvp = rsvp;
    }
    
    // Transform volunteer slots
    const volunteerSlotsWithCounts = event.volunteer_slots?.map(slot => ({
      ...slot,
      total_signups: slot.signups.reduce((sum, signup) => sum + signup.quantity, 0),
      available_spots: slot.quantity - slot.signups.reduce((sum, signup) => sum + signup.quantity, 0),
    })) || [];
    
    // Build event details response
    const eventDetails: EventDetails = {
      ...event,
      rsvp_count: event.rsvp_count?.[0]?.count || 0,
      attending_count: event.attending_count?.[0]?.count || 0,
      available_spots: event.capacity ? Math.max(0, event.capacity - (event.attending_count?.[0]?.count || 0)) : undefined,
      user_rsvp: userRsvp,
      volunteer_slots: volunteerSlotsWithCounts,
      can_edit: userId ? canUserEditEvent(event.created_by, userId, userRole) : false,
      can_view_attendees: userId ? canUserViewAttendees(event.created_by, userId, userRole) : false,
    };
    
    return NextResponse.json(eventDetails);
  } catch (error) {
    console.error('Error in GET /api/events/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    
    // Get event and check permissions
    const { data: event } = await supabase
      .from('events')
      .select('created_by')
      .eq('id', eventId)
      .single();
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    // Check user role and permissions
    const { data: member } = await supabase
      .from('members')
      .select('role')
      .eq('clerk_id', userId)
      .single();
    
    if (!canUserEditEvent(event.created_by, userId, member?.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this event' },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body: UpdateEventRequest = await request.json();
    const validatedUpdate = eventFormSchema.partial().parse(body.event);
    
    // Update event
    const { data: updatedEvent, error } = await supabase
      .from('events')
      .update({
        ...validatedUpdate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating event:', error);
      return NextResponse.json(
        { error: 'Failed to update event' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(updatedEvent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid event data', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error in PUT /api/events/[id]:', error);
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
    
    // Get event and check permissions
    const { data: event } = await supabase
      .from('events')
      .select('created_by')
      .eq('id', eventId)
      .single();
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    // Check user role and permissions
    const { data: member } = await supabase
      .from('members')
      .select('role')
      .eq('clerk_id', userId)
      .single();
    
    if (!canUserEditEvent(event.created_by, userId, member?.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this event' },
        { status: 403 }
      );
    }
    
    // Delete event (cascades to RSVPs and volunteer slots)
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);
    
    if (error) {
      console.error('Error deleting event:', error);
      return NextResponse.json(
        { error: 'Failed to delete event' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error in DELETE /api/events/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}