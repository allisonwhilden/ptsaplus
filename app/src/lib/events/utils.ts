/**
 * Event Management Utilities
 * 
 * Helper functions for working with events
 */

import { format, formatDistanceToNow, isSameDay, isToday, isTomorrow, isPast, isWithinInterval } from 'date-fns';
import { Event, EventWithCounts, LocationDetails, EventType } from './types';

// Date formatting helpers
export function formatEventDate(date: string | Date): string {
  const eventDate = new Date(date);
  
  if (isToday(eventDate)) {
    return `Today at ${format(eventDate, 'h:mm a')}`;
  }
  
  if (isTomorrow(eventDate)) {
    return `Tomorrow at ${format(eventDate, 'h:mm a')}`;
  }
  
  return format(eventDate, 'MMM d, yyyy \'at\' h:mm a');
}

export function formatEventDateRange(startTime: string | Date, endTime: string | Date): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  if (isSameDay(start, end)) {
    return `${format(start, 'MMM d, yyyy')} • ${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
  }
  
  return `${format(start, 'MMM d \'at\' h:mm a')} - ${format(end, 'MMM d \'at\' h:mm a')}`;
}

export function getEventTimeInfo(event: Event): string {
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  
  if (isPast(end)) {
    return `Ended ${formatDistanceToNow(end)} ago`;
  }
  
  if (isPast(start) && !isPast(end)) {
    return 'Happening now';
  }
  
  return `Starts ${formatDistanceToNow(start, { addSuffix: true })}`;
}

// Location helpers
export function formatLocation(locationType: string, locationDetails: LocationDetails): string {
  switch (locationType) {
    case 'virtual':
      return 'Virtual Event';
    case 'in_person':
      return locationDetails.address || 'Location TBD';
    case 'hybrid':
      return `${locationDetails.address || 'Location TBD'} + Virtual`;
    default:
      return 'Location TBD';
  }
}

export function getLocationDisplay(locationDetails: LocationDetails, locationType: string): {
  primary: string;
  secondary?: string;
} {
  if (locationType === 'virtual') {
    return {
      primary: 'Virtual Event',
      secondary: locationDetails.virtual_link ? 'Link will be provided' : undefined,
    };
  }
  
  if (locationType === 'in_person') {
    return {
      primary: locationDetails.address || 'Location TBD',
      secondary: locationDetails.room,
    };
  }
  
  // Hybrid
  return {
    primary: locationDetails.address || 'Location TBD',
    secondary: 'Also available virtually',
  };
}

// Capacity helpers
export function getAvailableSpots(event: EventWithCounts): number | null {
  if (!event.capacity) return null;
  return Math.max(0, event.capacity - event.attending_count);
}

export function getCapacityDisplay(event: EventWithCounts): string {
  if (!event.capacity) return '';
  
  const available = getAvailableSpots(event);
  if (available === 0) return 'Event Full';
  if (available && available <= 5) return `${available} spots left`;
  
  return `${event.attending_count}/${event.capacity} attending`;
}

export function isEventFull(event: EventWithCounts): boolean {
  if (!event.capacity) return false;
  return event.attending_count >= event.capacity;
}

// RSVP helpers
export function getUserRSVPStatus(event: EventWithCounts): string | null {
  return event.user_rsvp?.status || null;
}

export function canUserRSVP(event: Event, isAuthenticated: boolean): boolean {
  if (!isAuthenticated) return false;
  if (!event.requires_rsvp) return false;
  if (isPast(new Date(event.start_time))) return false;
  return true;
}

// Calendar export helpers
export function generateICalEvent(event: Event): string {
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  
  const formatICalDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };
  
  const location = event.location_type === 'virtual' 
    ? event.location_details.virtual_link 
    : event.location_details.address || '';
  
  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PTSA+//Event Calendar//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@ptsaplus.com`,
    `DTSTAMP:${formatICalDate(new Date())}`,
    `DTSTART:${formatICalDate(start)}`,
    `DTEND:${formatICalDate(end)}`,
    `SUMMARY:${event.title}`,
    event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
    location ? `LOCATION:${location}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
  
  return ical;
}

export function downloadICalFile(event: Event): void {
  const ical = generateICalEvent(event);
  const blob = new Blob([ical], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Google Calendar URL
export function getGoogleCalendarUrl(event: Event): string {
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  
  const formatGoogleDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };
  
  const location = event.location_type === 'virtual' 
    ? event.location_details.virtual_link 
    : event.location_details.address || '';
  
  const params = new URLSearchParams();
  params.append('action', 'TEMPLATE');
  params.append('text', event.title);
  params.append('dates', `${formatGoogleDate(start)}/${formatGoogleDate(end)}`);
  params.append('details', event.description || '');
  if (location) {
    params.append('location', location);
  }
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Event filtering helpers
export function filterEventsByDateRange(
  events: Event[],
  startDate?: Date,
  endDate?: Date
): Event[] {
  if (!startDate && !endDate) return events;
  
  return events.filter(event => {
    const eventStart = new Date(event.start_time);
    
    if (startDate && endDate) {
      return isWithinInterval(eventStart, { start: startDate, end: endDate });
    }
    
    if (startDate) {
      return eventStart >= startDate;
    }
    
    if (endDate) {
      return eventStart <= endDate;
    }
    
    return true;
  });
}

export function sortEventsByDate(events: Event[], ascending: boolean = true): Event[] {
  return [...events].sort((a, b) => {
    const dateA = new Date(a.start_time).getTime();
    const dateB = new Date(b.start_time).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
}

export function groupEventsByMonth(events: Event[]): Record<string, Event[]> {
  return events.reduce((groups, event) => {
    const month = format(new Date(event.start_time), 'MMMM yyyy');
    if (!groups[month]) {
      groups[month] = [];
    }
    groups[month].push(event);
    return groups;
  }, {} as Record<string, Event[]>);
}

// Event statistics
export function getEventStatistics(events: Event[]): {
  total: number;
  byType: Record<EventType, number>;
  upcoming: number;
  past: number;
} {
  const now = new Date();
  
  const stats = {
    total: events.length,
    byType: {} as Record<EventType, number>,
    upcoming: 0,
    past: 0,
  };
  
  events.forEach(event => {
    // Count by type
    if (!stats.byType[event.type]) {
      stats.byType[event.type] = 0;
    }
    stats.byType[event.type]++;
    
    // Count upcoming vs past
    if (isPast(new Date(event.end_time))) {
      stats.past++;
    } else {
      stats.upcoming++;
    }
  });
  
  return stats;
}