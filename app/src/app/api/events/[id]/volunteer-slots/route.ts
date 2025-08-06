/**
 * Event Volunteer Slots Management API Routes
 * 
 * GET /api/events/[id]/volunteer-slots - Get volunteer slots for an event
 * POST /api/events/[id]/volunteer-slots - Add volunteer slots (organizer only)
 * PUT /api/events/[id]/volunteer-slots/[slotId] - Update slot (organizer only)
 * DELETE /api/events/[id]/volunteer-slots/[slotId] - Delete slot (organizer only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase-server';
import { volunteerSlotSchema } from '@/lib/events/validation';
import { canUserEditEvent } from '@/lib/events/validation';
import { z } from 'zod';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const eventId = params.id;
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Get volunteer slots with signup counts
    const { data: slots, error } = await supabase
      .from('event_volunteer_slots')
      .select(`
        *,
        signups:event_volunteer_signups(
          id,
          user_id,
          quantity,
          notes,
          created_at,
          member:members!inner(
            id,
            first_name,
            last_name,
            email
          )
        )
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching volunteer slots:', error);
      return NextResponse.json(
        { error: 'Failed to fetch volunteer slots' },
        { status: 500 }
      );
    }
    
    // Transform slots to include counts
    const slotsWithCounts = slots.map(slot => {
      const totalSignups = slot.signups.reduce((sum, signup) => sum + signup.quantity, 0);
      return {
        ...slot,
        total_signups: totalSignups,
        available_spots: slot.quantity - totalSignups,
        signups: slot.signups.map(signup => ({
          ...signup,
          volunteer_name: `${signup.member.first_name} ${signup.member.last_name}`,
          volunteer_email: signup.member.email,
        })),
      };
    });
    
    return NextResponse.json(slotsWithCounts);
  } catch (error) {
    console.error('Error in GET /api/events/[id]/volunteer-slots:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const eventId = params.id;
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
        { error: 'You do not have permission to manage volunteer slots for this event' },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const slots = Array.isArray(body) ? body : [body];
    
    // Validate all slots
    const validatedSlots = slots.map(slot => {
      const validated = volunteerSlotSchema.parse(slot);
      return {
        ...validated,
        event_id: eventId,
      };
    });
    
    // Insert volunteer slots
    const { data: createdSlots, error } = await supabase
      .from('event_volunteer_slots')
      .insert(validatedSlots)
      .select();
    
    if (error) {
      console.error('Error creating volunteer slots:', error);
      return NextResponse.json(
        { error: 'Failed to create volunteer slots' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(createdSlots, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid volunteer slot data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error in POST /api/events/[id]/volunteer-slots:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}