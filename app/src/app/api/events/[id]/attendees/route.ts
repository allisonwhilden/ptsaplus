/**
 * Event Attendees API Route
 * 
 * GET /api/events/[id]/attendees - Get list of attendees (organizers/board/admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase-server';
import { canUserViewAttendees } from '@/lib/events/validation';

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
    
    const { id: eventId } = await params;
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Get event details and check permissions
    const { data: event } = await supabase
      .from('events')
      .select('created_by, title')
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
    
    if (!canUserViewAttendees(event.created_by, userId, member?.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to view attendees for this event' },
        { status: 403 }
      );
    }
    
    // Get attendees with member information
    const { data: attendees, error } = await supabase
      .from('event_rsvps')
      .select(`
        *,
        member:members!inner(
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('event_id', eventId)
      .eq('status', 'attending')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching attendees:', error);
      return NextResponse.json(
        { error: 'Failed to fetch attendees' },
        { status: 500 }
      );
    }
    
    // Transform attendees data to protect privacy
    const attendeeList = attendees.map(attendee => ({
      id: attendee.id,
      rsvp_date: attendee.created_at,
      guest_count: attendee.guest_count,
      notes: attendee.notes,
      member: {
        id: attendee.member.id,
        name: `${attendee.member.first_name} ${attendee.member.last_name}`,
        email: attendee.member.email,
        phone: attendee.member.phone,
      },
    }));
    
    // Calculate totals
    const totalAttendees = attendeeList.reduce(
      (sum, attendee) => sum + 1 + attendee.guest_count,
      0
    );
    
    return NextResponse.json({
      event: {
        id: eventId,
        title: event.title,
      },
      attendees: attendeeList,
      total_attendees: totalAttendees,
      total_members: attendeeList.length,
      total_guests: totalAttendees - attendeeList.length,
    });
  } catch (error) {
    console.error('Error in GET /api/events/[id]/attendees:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}