/**
 * Event Management Validation
 * 
 * Validation schemas and utilities for event-related data
 */

import { z } from 'zod';
import { EventType, LocationType, EventVisibility, RSVPStatus } from './types';

// Enum schemas
export const eventTypeSchema = z.enum(['meeting', 'fundraiser', 'volunteer', 'social', 'educational']);
export const locationTypeSchema = z.enum(['in_person', 'virtual', 'hybrid']);
export const eventVisibilitySchema = z.enum(['public', 'members', 'board']);
export const rsvpStatusSchema = z.enum(['attending', 'not_attending', 'maybe']);

// Location details schema
export const locationDetailsSchema = z.object({
  address: z.string().optional(),
  room: z.string().optional(),
  virtual_link: z.string().url().optional().or(z.literal('')),
  instructions: z.string().optional(),
}).passthrough();

// Event form schema
export const eventFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  type: eventTypeSchema,
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  location_type: locationTypeSchema,
  location_details: locationDetailsSchema,
  capacity: z.number().int().positive().optional().or(z.literal(null)),
  requires_rsvp: z.boolean(),
  allow_guests: z.boolean(),
  visibility: eventVisibilitySchema,
}).refine((data) => {
  const start = new Date(data.start_time);
  const end = new Date(data.end_time);
  return !isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start;
}, {
  message: 'End time must be after start time',
  path: ['end_time'],
}).refine((data) => {
  // Virtual events must have a virtual link
  if (data.location_type === 'virtual' || data.location_type === 'hybrid') {
    return data.location_details.virtual_link && data.location_details.virtual_link.length > 0;
  }
  return true;
}, {
  message: 'Virtual link is required for virtual/hybrid events',
  path: ['location_details'],
}).refine((data) => {
  // In-person events should have an address
  if (data.location_type === 'in_person' || data.location_type === 'hybrid') {
    return data.location_details.address && data.location_details.address.length > 0;
  }
  return true;
}, {
  message: 'Address is required for in-person/hybrid events',
  path: ['location_details'],
});

// RSVP schema
export const rsvpSchema = z.object({
  status: rsvpStatusSchema,
  guest_count: z.number().int().min(0).max(10).default(0),
  notes: z.string().max(500).optional(),
});

// Volunteer slot schema
export const volunteerSlotSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
  quantity: z.number().int().positive('Quantity must be at least 1'),
});

// Volunteer signup schema
export const volunteerSignupSchema = z.object({
  slot_id: z.string().uuid(),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  notes: z.string().max(500).optional(),
});

// Event list params schema
export const eventListParamsSchema = z.object({
  type: eventTypeSchema.optional(),
  visibility: eventVisibilitySchema.optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  search: z.string().max(100).optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// Validation helper functions
export function validateEventTimes(startTime: string, endTime: string): boolean {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const now = new Date();
  
  // Start time must be in the future (with 1 minute grace period for timing issues)
  const oneMinuteAgo = new Date(now.getTime() - 60000);
  if (start <= oneMinuteAgo) return false;
  
  // End time must be after start time
  return end > start;
}

export function validateCapacity(
  currentAttendees: number,
  newAttendees: number,
  capacity?: number
): boolean {
  // If capacity is undefined or null, no limit
  if (capacity === undefined || capacity === null) return true;
  // If capacity is 0, no attendees allowed
  if (capacity === 0) return currentAttendees + newAttendees === 0;
  // Otherwise check against capacity
  return currentAttendees + newAttendees <= capacity;
}

export function validateGuestCount(
  guestCount: number,
  allowGuests: boolean
): boolean {
  if (!allowGuests) return guestCount === 0;
  return guestCount >= 0 && guestCount <= 10;
}

export function canUserViewEvent(
  eventVisibility: EventVisibility,
  userRole?: string,
  isAuthenticated: boolean = false
): boolean {
  switch (eventVisibility) {
    case 'public':
      return true;
    case 'members':
      return isAuthenticated;
    case 'board':
      return userRole === 'admin' || userRole === 'board';
    default:
      return false;
  }
}

export function canUserEditEvent(
  eventCreatedBy: string,
  currentUserId: string,
  userRole?: string
): boolean {
  // Admin can edit any event
  if (userRole === 'admin') return true;
  
  // Board members can edit any event
  if (userRole === 'board') return true;
  
  // Event creator can edit their own event
  return eventCreatedBy === currentUserId;
}

export function canUserViewAttendees(
  eventCreatedBy: string,
  currentUserId: string,
  userRole?: string
): boolean {
  // Same permissions as editing for now
  return canUserEditEvent(eventCreatedBy, currentUserId, userRole);
}

// Event type helpers
export function getEventTypeLabel(type: EventType): string {
  const labels: Record<EventType, string> = {
    meeting: 'Meeting',
    fundraiser: 'Fundraiser',
    volunteer: 'Volunteer Opportunity',
    social: 'Social Event',
    educational: 'Educational Event',
  };
  return labels[type];
}

export function getEventTypeColor(type: EventType): string {
  const colors: Record<EventType, string> = {
    meeting: 'blue',
    fundraiser: 'green',
    volunteer: 'purple',
    social: 'yellow',
    educational: 'orange',
  };
  return colors[type];
}

// Location type helpers
export function getLocationTypeLabel(type: LocationType): string {
  const labels: Record<LocationType, string> = {
    in_person: 'In-Person',
    virtual: 'Virtual',
    hybrid: 'Hybrid',
  };
  return labels[type];
}

export function getLocationTypeIcon(type: LocationType): string {
  const icons: Record<LocationType, string> = {
    in_person: 'MapPin',
    virtual: 'Video',
    hybrid: 'Users',
  };
  return icons[type];
}