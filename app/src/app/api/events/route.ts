/**
 * Event Management API Routes
 * 
 * GET /api/events - List events with filtering
 * POST /api/events - Create a new event (board/admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase-server';
import { eventFormSchema, eventListParamsSchema } from '@/lib/events/validation';
import { canUserViewEvent } from '@/lib/events/validation';
import { EventWithCounts, CreateEventRequest } from '@/lib/events/types';
import { escapeSqlLikePattern } from '@/lib/utils';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    // Apply rate limiting for read operations
    const rateLimitResponse = await rateLimit(request, RATE_LIMITS.eventRead, userId);
    if (rateLimitResponse) return rateLimitResponse;
    
    // Handle both production and test environments
    let searchParams: URLSearchParams;
    if (request.nextUrl) {
      searchParams = request.nextUrl.searchParams;
    } else if (request.url) {
      // Fallback for test environments
      const url = new URL(request.url);
      searchParams = url.searchParams;
    } else {
      searchParams = new URLSearchParams();
    }
    
    // Parse and validate query parameters
    const params = eventListParamsSchema.parse({
      type: searchParams.get('type') || undefined,
      visibility: searchParams.get('visibility') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    });
    
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
    
    // Build query
    let query = supabase
      .from('events')
      .select(`
        *,
        event_rsvps!left(
          id,
          status,
          user_id
        )
      `, { count: 'exact' })
      .order('start_time', { ascending: true });
    
    // Apply filters
    if (params.type) {
      query = query.eq('type', params.type);
    }
    
    if (params.visibility) {
      query = query.eq('visibility', params.visibility);
    } else {
      // Filter by visibility based on user role
      if (!userId) {
        query = query.eq('visibility', 'public');
      } else if (userRole === 'admin' || userRole === 'board') {
        // Can see all events
      } else {
        query = query.in('visibility', ['public', 'members']);
      }
    }
    
    if (params.start_date) {
      query = query.gte('start_time', params.start_date);
    }
    
    if (params.end_date) {
      query = query.lte('start_time', params.end_date);
    }
    
    if (params.search) {
      // Escape special characters to prevent SQL injection
      const escapedSearch = escapeSqlLikePattern(params.search);
      query = query.or(`title.ilike.%${escapedSearch}%,description.ilike.%${escapedSearch}%`);
    }
    
    // Apply pagination
    query = query.range(params.offset, params.offset + params.limit - 1);
    
    const { data: events, error, count } = await query;
    
    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      );
    }
    
    // Get user's RSVPs if authenticated
    interface EventRSVP {
      id: string;
      event_id: string;
      user_id: string;
      status: string;
      guests_count?: number;
      notes?: string | null;
    }
    const userRsvps = new Map<string, EventRSVP>();
    if (userId && events.length > 0) {
      const eventIds = events.map(e => e.id);
      const { data: rsvps } = await supabase
        .from('event_rsvps')
        .select('*')
        .eq('user_id', userId)
        .in('event_id', eventIds);
      
      if (rsvps) {
        rsvps.forEach(rsvp => {
          userRsvps.set(rsvp.event_id, rsvp);
        });
      }
    }
    
    // Transform events to include counts and user RSVP data
    const eventsWithCounts: EventWithCounts[] = events.map(event => {
      // Count RSVPs from the joined data
      const rsvps = event.event_rsvps || [];
      const rsvpCount = rsvps.length;
      interface RSVPData {
        status: string;
      }
      const attendingCount = rsvps.filter((rsvp: RSVPData) => rsvp.status === 'attending').length;
      
      return {
        ...event,
        event_rsvps: undefined, // Remove the raw RSVP data from response
        rsvp_count: rsvpCount,
        attending_count: attendingCount,
        available_spots: event.capacity ? Math.max(0, event.capacity - attendingCount) : undefined,
        user_rsvp: userRsvps.get(event.id) || undefined,
      };
    });
    
    return NextResponse.json({
      events: eventsWithCounts,
      total: count || 0,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error in GET /api/events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
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
    
    // Apply rate limiting for mutation operations
    const rateLimitResponse = await rateLimit(request, RATE_LIMITS.eventMutation, userId);
    if (rateLimitResponse) return rateLimitResponse;
    
    const supabase = await createClient();
    
    // Check if user has permission to create events
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('role')
      .eq('clerk_id', userId)
      .single();
    
    if (memberError) {
      return NextResponse.json(
        { error: 'User not found in members table. Please ensure you are registered.' },
        { status: 403 }
      );
    }
    
    if (!member || (member.role !== 'admin' && member.role !== 'board')) {
      return NextResponse.json(
        { error: 'Only board members and admins can create events' },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body: CreateEventRequest = await request.json();
    const validatedEvent = eventFormSchema.parse(body.event);
    
    const eventData = {
      ...validatedEvent,
      organization_id: '00000000-0000-0000-0000-000000000000', // Single PTSA for now
      created_by: userId,
    };
    
    // Start a transaction
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single();
    
    if (eventError) {
      return NextResponse.json(
        { error: `Failed to create event: ${eventError.message}` },
        { status: 500 }
      );
    }
    
    // Create volunteer slots if provided
    if (body.volunteer_slots && body.volunteer_slots.length > 0) {
      const volunteerSlots = body.volunteer_slots.map(slot => ({
        ...slot,
        event_id: event.id,
      }));
      
      const { error: slotsError } = await supabase
        .from('event_volunteer_slots')
        .insert(volunteerSlots);
      
      if (slotsError) {
        // Rollback: Delete the created event if volunteer slots fail
        await supabase
          .from('events')
          .delete()
          .eq('id', event.id);
        
        console.error('Failed to create volunteer slots:', slotsError);
        return NextResponse.json(
          { error: 'Failed to create event with volunteer slots' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid event data', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create event' },
      { status: 500 }
    );
  }
}