/**
 * Event Volunteer API Routes
 * 
 * POST /api/events/[id]/volunteer - Sign up for a volunteer slot
 * DELETE /api/events/[id]/volunteer - Cancel volunteer signup
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase-server';
import { volunteerSignupSchema } from '@/lib/events/validation';
import { canUserViewEvent } from '@/lib/events/validation';
import { VolunteerSignupRequest } from '@/lib/events/types';
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
        { error: 'You must be logged in to volunteer' },
        { status: 401 }
      );
    }
    
    // Apply rate limiting for volunteer operations
    const rateLimitResponse = await rateLimit(request, RATE_LIMITS.volunteer, userId);
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
        { error: 'You must be a registered member to volunteer' },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body: VolunteerSignupRequest = await request.json();
    const validatedSignup = volunteerSignupSchema.parse(body);
    
    // Get event details to check visibility
    const { data: event } = await supabase
      .from('events')
      .select('visibility, type')
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
        { error: 'You do not have permission to volunteer for this event' },
        { status: 403 }
      );
    }
    
    // Verify the volunteer slot exists and belongs to this event
    const { data: slot } = await supabase
      .from('event_volunteer_slots')
      .select('*, event_id')
      .eq('id', validatedSignup.slot_id)
      .single();
    
    if (!slot || slot.event_id !== eventId) {
      return NextResponse.json(
        { error: 'Volunteer slot not found' },
        { status: 404 }
      );
    }
    
    // Check if user already signed up for this slot
    const { data: existingSignup } = await supabase
      .from('event_volunteer_signups')
      .select('*')
      .eq('slot_id', validatedSignup.slot_id)
      .eq('user_id', userId)
      .single();
    
    // Calculate current signups for the slot
    const { data: allSignups } = await supabase
      .from('event_volunteer_signups')
      .select('quantity')
      .eq('slot_id', validatedSignup.slot_id);
    
    const currentTotal = allSignups?.reduce((sum, signup) => sum + signup.quantity, 0) || 0;
    const previousQuantity = existingSignup?.quantity || 0;
    const availableSpots = slot.quantity - currentTotal + previousQuantity;
    
    // Check if there are enough spots available
    if (validatedSignup.quantity > availableSpots) {
      return NextResponse.json(
        { error: `Only ${availableSpots} spots available for this volunteer slot` },
        { status: 400 }
      );
    }
    
    // Create or update signup
    const signupData = {
      slot_id: validatedSignup.slot_id,
      user_id: userId,
      quantity: validatedSignup.quantity,
      notes: validatedSignup.notes,
    };
    
    let result;
    if (existingSignup) {
      // Update existing signup
      const { data, error } = await supabase
        .from('event_volunteer_signups')
        .update(signupData)
        .eq('id', existingSignup.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating volunteer signup:', error);
        return NextResponse.json(
          { error: 'Failed to update volunteer signup' },
          { status: 500 }
        );
      }
      
      result = data;
    } else {
      // Create new signup
      const { data, error } = await supabase
        .from('event_volunteer_signups')
        .insert(signupData)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating volunteer signup:', error);
        return NextResponse.json(
          { error: 'Failed to create volunteer signup' },
          { status: 500 }
        );
      }
      
      result = data;
    }
    
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid volunteer signup data', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error in POST /api/events/[id]/volunteer:', error);
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
    
    // Get slot_id from query params
    let slotId: string | null = null;
    
    // Try to get from nextUrl (production)
    if (request.nextUrl) {
      slotId = request.nextUrl.searchParams.get('slot_id');
    } else if (request.url) {
      // Fallback for test environments where nextUrl might not be set
      try {
        const url = new URL(request.url);
        slotId = url.searchParams.get('slot_id');
      } catch (e) {
        // Invalid URL, slotId remains null
      }
    }
    
    if (!slotId) {
      return NextResponse.json(
        { error: 'Slot ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Verify the slot belongs to this event
    const { data: slot } = await supabase
      .from('event_volunteer_slots')
      .select('event_id')
      .eq('id', slotId)
      .single();
    
    if (!slot || slot.event_id !== eventId) {
      return NextResponse.json(
        { error: 'Volunteer slot not found' },
        { status: 404 }
      );
    }
    
    // Delete signup
    const { error } = await supabase
      .from('event_volunteer_signups')
      .delete()
      .eq('slot_id', slotId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting volunteer signup:', error);
      
      // Handle specific database constraint violations
      if (error.message?.includes('constraint')) {
        return NextResponse.json(
          { 
            error: 'Cannot delete volunteer signup due to existing dependencies',
            details: 'Please ensure all related records are removed first'
          },
          { status: 409 } // Conflict
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to delete volunteer signup' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error in DELETE /api/events/[id]/volunteer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}