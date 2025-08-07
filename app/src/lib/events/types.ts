/**
 * Event Management System Types
 * 
 * These types define the structure for events, RSVPs, and volunteer signups
 * in the PTSA+ platform.
 */

export type EventType = 'meeting' | 'fundraiser' | 'volunteer' | 'social' | 'educational';
export type LocationType = 'in_person' | 'virtual' | 'hybrid';
export type EventVisibility = 'public' | 'members' | 'board';
export type RSVPStatus = 'attending' | 'not_attending' | 'maybe';

export interface LocationDetails {
  address?: string;
  room?: string;
  virtual_link?: string;
  instructions?: string;
  [key: string]: string | undefined;
}

export interface Event {
  id: string;
  organization_id: string;
  title: string;
  description?: string;
  type: EventType;
  start_time: string; // ISO 8601 timestamp
  end_time: string; // ISO 8601 timestamp
  location_type: LocationType;
  location_details: LocationDetails;
  capacity?: number;
  requires_rsvp: boolean;
  allow_guests: boolean;
  visibility: EventVisibility;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EventFormData {
  title: string;
  description?: string;
  type: EventType;
  start_time: string;
  end_time: string;
  location_type: LocationType;
  location_details: LocationDetails;
  capacity?: number;
  requires_rsvp: boolean;
  allow_guests: boolean;
  visibility: EventVisibility;
}

export interface EventRSVP {
  id: string;
  event_id: string;
  user_id: string;
  status: RSVPStatus;
  guest_count: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EventVolunteerSlot {
  id: string;
  event_id: string;
  title: string;
  description?: string;
  quantity: number;
  created_at: string;
}

export interface EventVolunteerSignup {
  id: string;
  slot_id: string;
  user_id: string;
  quantity: number;
  notes?: string;
  created_at: string;
}

// Extended types with joined data
export interface EventWithCounts extends Event {
  rsvp_count: number;
  attending_count: number;
  available_spots?: number;
  user_rsvp?: EventRSVP;
}

export interface VolunteerSlotWithSignups extends EventVolunteerSlot {
  signups: EventVolunteerSignup[];
  total_signups: number;
  available_spots: number;
}

export interface EventDetails extends EventWithCounts {
  volunteer_slots?: VolunteerSlotWithSignups[];
  can_edit: boolean;
  can_view_attendees: boolean;
}

// API request/response types
export interface CreateEventRequest {
  event: EventFormData;
  volunteer_slots?: Omit<EventVolunteerSlot, 'id' | 'event_id' | 'created_at'>[];
}

export interface UpdateEventRequest {
  event: Partial<EventFormData>;
}

export interface RSVPRequest {
  status: RSVPStatus;
  guest_count?: number;
  notes?: string;
}

export interface VolunteerSignupRequest {
  slot_id: string;
  quantity: number;
  notes?: string;
}

export interface EventListParams {
  type?: EventType;
  visibility?: EventVisibility;
  start_date?: string;
  end_date?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface EventListResponse {
  events: EventWithCounts[];
  total: number;
}

// Utility type for form validation
export interface EventValidationErrors {
  title?: string;
  type?: string;
  start_time?: string;
  end_time?: string;
  location_type?: string;
  location_details?: string;
  capacity?: string;
  visibility?: string;
}