/**
 * Event Details Page
 * 
 * Individual event page with full details and actions
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase-server';
import { EventDetails } from '@/components/events/EventDetails';
import { canUserViewEvent, canUserEditEvent, canUserViewAttendees } from '@/lib/events/validation';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase
    .from('events')
    .select('title, description')
    .eq('id', id)
    .single();
  
  if (!event) {
    return {
      title: 'Event Not Found | PTSA Platform',
    };
  }
  
  return {
    title: `${event.title} | PTSA Platform`,
    description: event.description || 'View event details and RSVP',
  };
}

export default async function EventPage({ params }: PageProps) {
  const { userId } = await auth();
  const { id: eventId } = await params;
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
  
  // Get event with all details
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
    notFound();
  }
  
  // Check if user can view this event
  if (!canUserViewEvent(event.visibility, userRole, !!userId)) {
    notFound();
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
  interface VolunteerSignup {
    quantity: number;
  }
  
  interface VolunteerSlot {
    signups: VolunteerSignup[];
    quantity: number;
    [key: string]: unknown;
  }
  
  const volunteerSlotsWithCounts = event.volunteer_slots?.map((slot: VolunteerSlot) => ({
    ...slot,
    total_signups: slot.signups.reduce((sum: number, signup: VolunteerSignup) => sum + signup.quantity, 0),
    available_spots: slot.quantity - slot.signups.reduce((sum: number, signup: VolunteerSignup) => sum + signup.quantity, 0),
  })) || [];
  
  // Build event details
  const eventDetails = {
    ...event,
    rsvp_count: event.rsvp_count?.[0]?.count || 0,
    attending_count: event.attending_count?.[0]?.count || 0,
    available_spots: event.capacity ? Math.max(0, event.capacity - (event.attending_count?.[0]?.count || 0)) : undefined,
    user_rsvp: userRsvp,
    volunteer_slots: volunteerSlotsWithCounts,
    can_edit: userId ? canUserEditEvent(event.created_by, userId, userRole) : false,
    can_view_attendees: userId ? canUserViewAttendees(event.created_by, userId, userRole) : false,
  };
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <EventDetails event={eventDetails} userId={userId || undefined} />
    </div>
  );
}