/**
 * Event Validation Tests
 * 
 * Unit tests for event validation functions including privacy controls,
 * capacity management, and business logic validation.
 */

import {
  eventFormSchema,
  rsvpSchema,
  volunteerSlotSchema,
  volunteerSignupSchema,
  eventListParamsSchema,
  validateEventTimes,
  validateCapacity,
  validateGuestCount,
  canUserViewEvent,
  canUserEditEvent,
  canUserViewAttendees,
  getEventTypeLabel,
  getEventTypeColor,
  getLocationTypeLabel,
  getLocationTypeIcon,
} from '@/lib/events/validation';
import { EventType, LocationType, EventVisibility, RSVPStatus } from '@/lib/events/types';

describe('Event Validation Schemas', () => {
  describe('eventFormSchema', () => {
    const validEventData = {
      title: 'Test Event',
      description: 'A test event description',
      type: 'meeting' as EventType,
      start_time: '2025-08-10T10:00:00Z',
      end_time: '2025-08-10T12:00:00Z',
      location_type: 'in_person' as LocationType,
      location_details: {
        address: '123 Main St, Anytown USA',
        room: 'Conference Room A',
      },
      capacity: 50,
      requires_rsvp: true,
      allow_guests: true,
      visibility: 'members' as EventVisibility,
    };

    it('should validate a complete valid event', () => {
      const result = eventFormSchema.safeParse(validEventData);
      expect(result.success).toBe(true);
    });

    it('should require title', () => {
      const invalidData = { ...validEventData, title: '' };
      const result = eventFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should enforce title length limit', () => {
      const invalidData = { ...validEventData, title: 'a'.repeat(201) };
      const result = eventFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should enforce description length limit', () => {
      const invalidData = { ...validEventData, description: 'a'.repeat(2001) };
      const result = eventFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate event type enum', () => {
      const invalidData = { ...validEventData, type: 'invalid_type' as EventType };
      const result = eventFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require end_time after start_time', () => {
      const invalidData = {
        ...validEventData,
        start_time: '2025-08-10T12:00:00Z',
        end_time: '2025-08-10T10:00:00Z',
      };
      const result = eventFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require virtual link for virtual events', () => {
      const invalidData = {
        ...validEventData,
        location_type: 'virtual' as LocationType,
        location_details: { address: '123 Main St' }, // missing virtual_link
      };
      const result = eventFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require address for in-person events', () => {
      const invalidData = {
        ...validEventData,
        location_type: 'in_person' as LocationType,
        location_details: { virtual_link: 'https://zoom.us/123' }, // missing address
      };
      const result = eventFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require both address and virtual link for hybrid events', () => {
      const validHybrid = {
        ...validEventData,
        location_type: 'hybrid' as LocationType,
        location_details: {
          address: '123 Main St',
          virtual_link: 'https://zoom.us/123',
        },
      };
      const result = eventFormSchema.safeParse(validHybrid);
      expect(result.success).toBe(true);
    });

    it('should accept null capacity', () => {
      const validData = { ...validEventData, capacity: null };
      const result = eventFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require positive capacity if provided', () => {
      const invalidData = { ...validEventData, capacity: -1 };
      const result = eventFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('rsvpSchema', () => {
    it('should validate valid RSVP data', () => {
      const validRsvp = {
        status: 'attending' as RSVPStatus,
        guest_count: 2,
        notes: 'Looking forward to this event',
      };
      const result = rsvpSchema.safeParse(validRsvp);
      expect(result.success).toBe(true);
    });

    it('should default guest_count to 0', () => {
      const rsvpData = { status: 'attending' as RSVPStatus };
      const result = rsvpSchema.safeParse(rsvpData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.guest_count).toBe(0);
      }
    });

    it('should limit guest_count to maximum 10', () => {
      const invalidRsvp = { status: 'attending' as RSVPStatus, guest_count: 11 };
      const result = rsvpSchema.safeParse(invalidRsvp);
      expect(result.success).toBe(false);
    });

    it('should not allow negative guest_count', () => {
      const invalidRsvp = { status: 'attending' as RSVPStatus, guest_count: -1 };
      const result = rsvpSchema.safeParse(invalidRsvp);
      expect(result.success).toBe(false);
    });

    it('should limit notes length', () => {
      const invalidRsvp = {
        status: 'attending' as RSVPStatus,
        notes: 'a'.repeat(501),
      };
      const result = rsvpSchema.safeParse(invalidRsvp);
      expect(result.success).toBe(false);
    });
  });

  describe('volunteerSlotSchema', () => {
    it('should validate valid volunteer slot', () => {
      const validSlot = {
        title: 'Setup Crew',
        description: 'Help set up tables and chairs',
        quantity: 5,
      };
      const result = volunteerSlotSchema.safeParse(validSlot);
      expect(result.success).toBe(true);
    });

    it('should require title', () => {
      const invalidSlot = { title: '', quantity: 1 };
      const result = volunteerSlotSchema.safeParse(invalidSlot);
      expect(result.success).toBe(false);
    });

    it('should require positive quantity', () => {
      const invalidSlot = { title: 'Setup', quantity: 0 };
      const result = volunteerSlotSchema.safeParse(invalidSlot);
      expect(result.success).toBe(false);
    });

    it('should limit title length', () => {
      const invalidSlot = { title: 'a'.repeat(101), quantity: 1 };
      const result = volunteerSlotSchema.safeParse(invalidSlot);
      expect(result.success).toBe(false);
    });
  });

  describe('volunteerSignupSchema', () => {
    it('should validate valid volunteer signup', () => {
      const validSignup = {
        slot_id: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 1,
        notes: 'I can help with setup',
      };
      const result = volunteerSignupSchema.safeParse(validSignup);
      expect(result.success).toBe(true);
    });

    it('should require valid UUID for slot_id', () => {
      const invalidSignup = { slot_id: 'invalid-uuid', quantity: 1 };
      const result = volunteerSignupSchema.safeParse(invalidSignup);
      expect(result.success).toBe(false);
    });

    it('should require positive quantity', () => {
      const invalidSignup = {
        slot_id: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 0,
      };
      const result = volunteerSignupSchema.safeParse(invalidSignup);
      expect(result.success).toBe(false);
    });
  });

  describe('eventListParamsSchema', () => {
    it('should validate with default values', () => {
      const result = eventListParamsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
        expect(result.data.offset).toBe(0);
      }
    });

    it('should limit maximum results per page', () => {
      const invalidParams = { limit: 150 };
      const result = eventListParamsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });

    it('should not allow negative offset', () => {
      const invalidParams = { offset: -1 };
      const result = eventListParamsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });

    it('should limit search query length', () => {
      const invalidParams = { search: 'a'.repeat(101) };
      const result = eventListParamsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
  });
});

describe('Event Validation Helper Functions', () => {
  describe('validateEventTimes', () => {
    it('should accept future events with end after start', () => {
      const futureStart = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Tomorrow
      const futureEnd = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(); // Tomorrow + 1hr
      
      expect(validateEventTimes(futureStart, futureEnd)).toBe(true);
    });

    it('should reject events with end before start', () => {
      const futureStart = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const futureEnd = new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString();
      
      expect(validateEventTimes(futureStart, futureEnd)).toBe(false);
    });

    it('should reject events that start in the past', () => {
      const pastStart = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago
      const futureEnd = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now
      
      expect(validateEventTimes(pastStart, futureEnd)).toBe(false);
    });
  });

  describe('validateCapacity', () => {
    it('should allow unlimited capacity when no limit set', () => {
      expect(validateCapacity(50, 100)).toBe(true);
    });

    it('should allow attendance within capacity', () => {
      expect(validateCapacity(10, 5, 20)).toBe(true);
    });

    it('should reject attendance over capacity', () => {
      expect(validateCapacity(18, 5, 20)).toBe(false);
    });

    it('should allow exact capacity', () => {
      expect(validateCapacity(15, 5, 20)).toBe(true);
    });
  });

  describe('validateGuestCount', () => {
    it('should allow guests when event allows them', () => {
      expect(validateGuestCount(3, true)).toBe(true);
    });

    it('should reject guests when event does not allow them', () => {
      expect(validateGuestCount(1, false)).toBe(false);
    });

    it('should require zero guests when not allowed', () => {
      expect(validateGuestCount(0, false)).toBe(true);
    });

    it('should limit guests to maximum 10', () => {
      expect(validateGuestCount(10, true)).toBe(true);
      expect(validateGuestCount(11, true)).toBe(false);
    });

    it('should not allow negative guests', () => {
      expect(validateGuestCount(-1, true)).toBe(false);
    });
  });
});

describe('Event Permission Functions', () => {
  describe('canUserViewEvent', () => {
    it('should allow anyone to view public events', () => {
      expect(canUserViewEvent('public')).toBe(true);
      expect(canUserViewEvent('public', undefined, false)).toBe(true);
      expect(canUserViewEvent('public', 'member', true)).toBe(true);
    });

    it('should require authentication for member events', () => {
      expect(canUserViewEvent('members', 'member', false)).toBe(false);
      expect(canUserViewEvent('members', 'member', true)).toBe(true);
      expect(canUserViewEvent('members', undefined, true)).toBe(true);
    });

    it('should require board role for board events', () => {
      expect(canUserViewEvent('board', 'member', true)).toBe(false);
      expect(canUserViewEvent('board', 'board', true)).toBe(true);
      expect(canUserViewEvent('board', 'admin', true)).toBe(true);
    });

    it('should deny unauthenticated users from private events', () => {
      expect(canUserViewEvent('members', undefined, false)).toBe(false);
      expect(canUserViewEvent('board', undefined, false)).toBe(false);
    });
  });

  describe('canUserEditEvent', () => {
    const eventCreatorId = 'creator-123';
    const currentUserId = 'user-456';

    it('should allow admin to edit any event', () => {
      expect(canUserEditEvent(eventCreatorId, currentUserId, 'admin')).toBe(true);
    });

    it('should allow board members to edit any event', () => {
      expect(canUserEditEvent(eventCreatorId, currentUserId, 'board')).toBe(true);
    });

    it('should allow event creator to edit their own event', () => {
      expect(canUserEditEvent(eventCreatorId, eventCreatorId, 'member')).toBe(true);
    });

    it('should prevent regular members from editing others events', () => {
      expect(canUserEditEvent(eventCreatorId, currentUserId, 'member')).toBe(false);
    });

    it('should prevent unauthenticated users from editing events', () => {
      expect(canUserEditEvent(eventCreatorId, currentUserId)).toBe(false);
    });
  });

  describe('canUserViewAttendees', () => {
    const eventCreatorId = 'creator-123';
    const currentUserId = 'user-456';

    it('should use same permissions as editing for now', () => {
      expect(canUserViewAttendees(eventCreatorId, currentUserId, 'admin')).toBe(true);
      expect(canUserViewAttendees(eventCreatorId, currentUserId, 'board')).toBe(true);
      expect(canUserViewAttendees(eventCreatorId, eventCreatorId, 'member')).toBe(true);
      expect(canUserViewAttendees(eventCreatorId, currentUserId, 'member')).toBe(false);
    });
  });
});

describe('Event Type and Location Helper Functions', () => {
  describe('getEventTypeLabel', () => {
    it('should return correct labels for all event types', () => {
      expect(getEventTypeLabel('meeting')).toBe('Meeting');
      expect(getEventTypeLabel('fundraiser')).toBe('Fundraiser');
      expect(getEventTypeLabel('volunteer')).toBe('Volunteer Opportunity');
      expect(getEventTypeLabel('social')).toBe('Social Event');
      expect(getEventTypeLabel('educational')).toBe('Educational Event');
    });
  });

  describe('getEventTypeColor', () => {
    it('should return colors for all event types', () => {
      expect(getEventTypeColor('meeting')).toBe('blue');
      expect(getEventTypeColor('fundraiser')).toBe('green');
      expect(getEventTypeColor('volunteer')).toBe('purple');
      expect(getEventTypeColor('social')).toBe('yellow');
      expect(getEventTypeColor('educational')).toBe('orange');
    });
  });

  describe('getLocationTypeLabel', () => {
    it('should return correct labels for all location types', () => {
      expect(getLocationTypeLabel('in_person')).toBe('In-Person');
      expect(getLocationTypeLabel('virtual')).toBe('Virtual');
      expect(getLocationTypeLabel('hybrid')).toBe('Hybrid');
    });
  });

  describe('getLocationTypeIcon', () => {
    it('should return icon names for all location types', () => {
      expect(getLocationTypeIcon('in_person')).toBe('MapPin');
      expect(getLocationTypeIcon('virtual')).toBe('Video');
      expect(getLocationTypeIcon('hybrid')).toBe('Users');
    });
  });
});

describe('Edge Cases and Error Scenarios', () => {
  describe('Invalid enum values', () => {
    it('should reject invalid event types', () => {
      const invalidData = {
        title: 'Test',
        type: 'invalid_type',
        start_time: '2025-08-10T10:00:00Z',
        end_time: '2025-08-10T12:00:00Z',
        location_type: 'in_person',
        location_details: { address: '123 Main St' },
        requires_rsvp: false,
        allow_guests: false,
        visibility: 'public',
      };
      
      const result = eventFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid RSVP status', () => {
      const invalidRsvp = { status: 'invalid_status' };
      const result = rsvpSchema.safeParse(invalidRsvp);
      expect(result.success).toBe(false);
    });

    it('should reject invalid visibility', () => {
      const invalidData = {
        title: 'Test',
        type: 'meeting',
        start_time: '2025-08-10T10:00:00Z',
        end_time: '2025-08-10T12:00:00Z',
        location_type: 'in_person',
        location_details: { address: '123 Main St' },
        requires_rsvp: false,
        allow_guests: false,
        visibility: 'invalid_visibility',
      };
      
      const result = eventFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Boundary value testing', () => {
    it('should handle title at exact character limits', () => {
      const validData = {
        title: 'a'.repeat(200), // Exactly at limit
        type: 'meeting' as EventType,
        start_time: '2025-08-10T10:00:00Z',
        end_time: '2025-08-10T12:00:00Z',
        location_type: 'in_person' as LocationType,
        location_details: { address: '123 Main St' },
        requires_rsvp: false,
        allow_guests: false,
        visibility: 'public' as EventVisibility,
      };
      
      const result = eventFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should handle guest count boundaries', () => {
      expect(validateGuestCount(0, true)).toBe(true);
      expect(validateGuestCount(10, true)).toBe(true);
      expect(validateGuestCount(11, true)).toBe(false);
    });

    it('should handle capacity boundaries', () => {
      expect(validateCapacity(19, 1, 20)).toBe(true);
      expect(validateCapacity(20, 1, 20)).toBe(false);
    });
  });

  describe('Datetime validation edge cases', () => {
    it('should handle same start and end times', () => {
      const sameTime = '2025-08-10T10:00:00Z';
      expect(validateEventTimes(sameTime, sameTime)).toBe(false);
    });

    it('should handle events that start exactly now', () => {
      // Use a fixed time that's definitely in the past (more than 1 minute ago)
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const later = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      
      // Should be false because start time must be in the future
      expect(validateEventTimes(twoMinutesAgo, later)).toBe(false);
      
      // Test with time exactly 30 seconds ago (within grace period)
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();
      const laterFromThirtySecondsAgo = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      
      // Should be true because it's within the 1-minute grace period
      expect(validateEventTimes(thirtySecondsAgo, laterFromThirtySecondsAgo)).toBe(true);
    });
  });
});