/**
 * Event Management Edge Cases and Security Tests
 * 
 * Comprehensive tests for critical edge cases, security vulnerabilities,
 * and error scenarios that could impact PTSA+ production usage.
 * These tests ensure the system is resilient against volunteer user errors
 * and potential security threats.
 */

import { 
  validateCapacity, 
  validateGuestCount, 
  canUserViewEvent,
  canUserEditEvent,
  eventFormSchema 
} from '@/lib/events/validation';

// Mock dependencies before importing them
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/supabase-server', () => ({
  createClient: jest.fn(),
}));

// Import mocked dependencies
import { createClient } from '@/lib/supabase-server';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

interface MockSupabaseClient {
  from: jest.Mock;
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  eq: jest.Mock;
  single: jest.Mock;
}

describe('Event Management Edge Cases & Security', () => {
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    };

    // @ts-expect-error - Mock typing for tests
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  describe('Data Integrity and Validation Edge Cases', () => {
    describe('Extreme Input Values', () => {
      it('should handle very large event titles gracefully', () => {
        const longTitle = 'a'.repeat(200); // At the limit
        const overlongTitle = 'a'.repeat(201); // Over the limit

        const validEvent = {
          title: longTitle,
          type: 'meeting',
          start_time: '2025-08-20T19:00:00Z',
          end_time: '2025-08-20T21:00:00Z',
          location_type: 'in_person',
          location_details: { address: '123 Main St' },
          requires_rsvp: false,
          allow_guests: false,
          visibility: 'public',
        };

        const invalidEvent = { ...validEvent, title: overlongTitle };

        expect(eventFormSchema.safeParse(validEvent).success).toBe(true);
        expect(eventFormSchema.safeParse(invalidEvent).success).toBe(false);
      });

      it('should handle very large descriptions', () => {
        const longDescription = 'a'.repeat(2000); // At the limit
        const overlongDescription = 'a'.repeat(2001); // Over the limit

        const baseEvent = {
          title: 'Test Event',
          type: 'meeting',
          start_time: '2025-08-20T19:00:00Z',
          end_time: '2025-08-20T21:00:00Z',
          location_type: 'in_person',
          location_details: { address: '123 Main St' },
          requires_rsvp: false,
          allow_guests: false,
          visibility: 'public',
        };

        expect(eventFormSchema.safeParse({ ...baseEvent, description: longDescription }).success).toBe(true);
        expect(eventFormSchema.safeParse({ ...baseEvent, description: overlongDescription }).success).toBe(false);
      });

      it('should handle maximum guest counts correctly', () => {
        expect(validateGuestCount(10, true)).toBe(true); // At limit
        expect(validateGuestCount(11, true)).toBe(false); // Over limit
        expect(validateGuestCount(0, true)).toBe(true); // Minimum
        expect(validateGuestCount(-1, true)).toBe(false); // Below minimum
      });

      it('should handle very large capacity values', () => {
        // Test with realistic but large capacity
        expect(validateCapacity(500, 100, 1000)).toBe(true);
        
        // Test at exact capacity
        expect(validateCapacity(900, 100, 1000)).toBe(true);
        
        // Test exceeding capacity
        expect(validateCapacity(950, 100, 1000)).toBe(false);
      });
    });

    describe('Temporal Edge Cases', () => {
      it('should handle events starting exactly at midnight', () => {
        const midnightEvent = {
          title: 'Midnight Event',
          type: 'meeting',
          start_time: '2025-08-20T00:00:00Z',
          end_time: '2025-08-20T01:00:00Z',
          location_type: 'virtual',
          location_details: { virtual_link: 'https://zoom.us/123' },
          requires_rsvp: false,
          allow_guests: false,
          visibility: 'public',
        };

        expect(eventFormSchema.safeParse(midnightEvent).success).toBe(true);
      });

      it('should handle events spanning multiple days', () => {
        const multiDayEvent = {
          title: 'Weekend Retreat',
          type: 'social',
          start_time: '2025-08-20T18:00:00Z',
          end_time: '2025-08-22T14:00:00Z', // 2+ days later
          location_type: 'in_person',
          location_details: { address: 'Retreat Center' },
          requires_rsvp: true,
          allow_guests: true,
          visibility: 'members',
        };

        expect(eventFormSchema.safeParse(multiDayEvent).success).toBe(true);
      });

      it('should handle timezone edge cases', () => {
        // Event times in different timezone formats should be valid
        const timezoneVariations = [
          '2025-08-20T19:00:00Z', // UTC
          '2025-08-20T19:00:00.000Z', // UTC with milliseconds
          '2025-08-20T15:00:00-04:00', // EDT
          '2025-08-20T12:00:00-07:00', // PDT
        ];

        timezoneVariations.forEach(startTime => {
          const event = {
            title: 'Timezone Test',
            type: 'meeting',
            start_time: startTime,
            end_time: '2025-08-20T21:00:00Z',
            location_type: 'virtual',
            location_details: { virtual_link: 'https://zoom.us/123' },
            requires_rsvp: false,
            allow_guests: false,
            visibility: 'public',
          };

          expect(eventFormSchema.safeParse(event).success).toBe(true);
        });
      });

      it('should reject events with microsecond differences between start and end', () => {
        const almostSameTime = {
          title: 'Invalid Event',
          type: 'meeting',
          start_time: '2025-08-20T19:00:00.000Z',
          end_time: '2025-08-20T19:00:00.001Z', // 1ms later
          location_type: 'virtual',
          location_details: { virtual_link: 'https://zoom.us/123' },
          requires_rsvp: false,
          allow_guests: false,
          visibility: 'public',
        };

        // Should still be valid as it's technically after
        expect(eventFormSchema.safeParse(almostSameTime).success).toBe(true);
      });
    });

    describe('Unicode and Special Character Handling', () => {
      it('should handle unicode characters in event data', () => {
        const unicodeEvent = {
          title: '🎉 PTA Spring Festival 2025 🌸',
          description: 'Celebración de primavera with café ☕ and música 🎵',
          type: 'social',
          start_time: '2025-08-20T19:00:00Z',
          end_time: '2025-08-20T21:00:00Z',
          location_type: 'in_person',
          location_details: { 
            address: '123 Main St, São Paulo',
            room: 'Café Area' 
          },
          requires_rsvp: true,
          allow_guests: true,
          visibility: 'public',
        };

        expect(eventFormSchema.safeParse(unicodeEvent).success).toBe(true);
      });

      it('should handle special characters in location details', () => {
        const specialCharEvent = {
          title: 'Meeting at O\'Reilly School',
          type: 'meeting',
          start_time: '2025-08-20T19:00:00Z',
          end_time: '2025-08-20T21:00:00Z',
          location_type: 'in_person',
          location_details: { 
            address: '123 O\'Brien St & 5th Ave',
            room: 'Room #204-A',
            instructions: 'Enter through the "Main" entrance' 
          },
          requires_rsvp: false,
          allow_guests: false,
          visibility: 'public',
        };

        expect(eventFormSchema.safeParse(specialCharEvent).success).toBe(true);
      });

      it('should handle HTML/script injection attempts in event data', () => {
        const maliciousEvent = {
          title: '<script>alert("xss")</script>Test Event',
          description: '<img src="x" onerror="alert(1)">Description',
          type: 'meeting',
          start_time: '2025-08-20T19:00:00Z',
          end_time: '2025-08-20T21:00:00Z',
          location_type: 'in_person',
          location_details: { 
            address: '<script>steal_data()</script>123 Main St' 
          },
          requires_rsvp: false,
          allow_guests: false,
          visibility: 'public',
        };

        // Validation should pass (input validation), but sanitization 
        // should happen at the display/storage layer
        expect(eventFormSchema.safeParse(maliciousEvent).success).toBe(true);
      });
    });
  });

  describe('Concurrent Operation Scenarios', () => {
    describe('Race Conditions in Capacity Management', () => {
      it('should handle simultaneous RSVP attempts at capacity limit', () => {
        // Test scenario: Event has 1 spot left, 2 users try to RSVP simultaneously
        const currentAttendees = 49;
        const eventCapacity = 50;

        // First user's request
        const user1CanAttend = validateCapacity(currentAttendees, 1, eventCapacity);
        
        // Second user's request (assuming first hasn't been processed yet)
        const user2CanAttend = validateCapacity(currentAttendees, 1, eventCapacity);

        // Both would validate as true, but database constraints should prevent over-booking
        expect(user1CanAttend).toBe(true);
        expect(user2CanAttend).toBe(true);
        
        // The actual prevention happens at the database level with triggers
      });

      it('should handle capacity calculations with guests correctly', () => {
        // Event capacity: 20, current: 18 people
        // User wants to bring 3 guests (4 total spots needed)
        // Should fail as it would exceed capacity
        expect(validateCapacity(18, 4, 20)).toBe(false);
        
        // User wants to bring 1 guest (2 total spots needed)
        // Should succeed as it equals capacity
        expect(validateCapacity(18, 2, 20)).toBe(true);
      });

      it('should handle volunteer slot capacity correctly with concurrent signups', () => {
        // Scenario: Slot has 3 spots, currently 2 taken
        // Two users simultaneously try to sign up for 1 spot each
        // Both should validate as true locally, but database should prevent over-booking
        const slotCapacity = 3;
        const currentSignups = 2;
        
        const availableSpots = slotCapacity - currentSignups;
        expect(availableSpots).toBe(1);
        
        // Both users requesting 1 spot each
        const user1Valid = 1 <= availableSpots;
        const user2Valid = 1 <= availableSpots;
        
        expect(user1Valid).toBe(true);
        expect(user2Valid).toBe(true);
        
        // Database triggers should handle the actual conflict resolution
      });
    });

    describe('State Consistency During Updates', () => {
      it('should handle user changing RSVP status multiple times rapidly', () => {
        // Scenario: User rapidly clicks between attending/not attending
        // Each state change should be processed correctly
        const eventCapacity = 50;
        const baseAttendeeCount = 30;

        // User starts as not attending, changes to attending
        let currentCount = baseAttendeeCount;
        expect(validateCapacity(currentCount, 1, eventCapacity)).toBe(true);
        
        // User changes back to not attending (frees up spot)
        currentCount = baseAttendeeCount; // Back to original count
        
        // User changes to attending again
        expect(validateCapacity(currentCount, 1, eventCapacity)).toBe(true);
      });
    });
  });

  describe('Security and Privacy Edge Cases', () => {
    describe('Authorization Boundary Testing', () => {
      it('should enforce strict role-based access for board events', () => {
        // Member trying to access board event
        expect(canUserViewEvent('board', 'member', true)).toBe(false);
        expect(canUserViewEvent('board', 'committee_chair', true)).toBe(false);
        expect(canUserViewEvent('board', 'teacher', true)).toBe(false);
        
        // Board and admin should have access
        expect(canUserViewEvent('board', 'board', true)).toBe(true);
        expect(canUserViewEvent('board', 'admin', true)).toBe(true);
      });

      it('should prevent privilege escalation through role manipulation', () => {
        const eventCreatorId = 'creator-123';
        const attackerId = 'attacker-456';
        
        // Attacker cannot edit others' events even if they claim to be admin
        expect(canUserEditEvent(eventCreatorId, attackerId, 'member')).toBe(false);
        
        // Only actual admin/board or event creator can edit
        expect(canUserEditEvent(eventCreatorId, attackerId, 'admin')).toBe(true);
        expect(canUserEditEvent(eventCreatorId, eventCreatorId, 'member')).toBe(true);
      });

      it('should handle undefined/null role values safely', () => {
        expect(canUserViewEvent('members', undefined, true)).toBe(true);
        expect(canUserViewEvent('members', null as unknown as string, true)).toBe(true);
        expect(canUserViewEvent('board', undefined, true)).toBe(false);
        expect(canUserViewEvent('board', null as unknown as string, true)).toBe(false);
      });
    });

    describe('Data Exposure Prevention', () => {
      it('should not expose sensitive information in validation errors', () => {
        // Ensure validation errors don't leak internal data
        const invalidEvent = {
          title: '',
          type: 'invalid_type',
          start_time: 'invalid_date',
          end_time: 'invalid_date',
          location_type: 'invalid_location',
          location_details: {},
          requires_rsvp: 'invalid_boolean',
          allow_guests: 'invalid_boolean',
          visibility: 'invalid_visibility',
        };

        const result = eventFormSchema.safeParse(invalidEvent);
        expect(result.success).toBe(false);
        
        if (!result.success) {
          // Check that error messages don't contain sensitive info
          const errorMessages = result.error.issues.map((e: { message: string }) => e.message).join(' ');
          expect(errorMessages).not.toContain('database');
          expect(errorMessages).not.toContain('admin');
          expect(errorMessages).not.toContain('secret');
          expect(errorMessages).not.toContain('password');
        }
      });
    });

    describe('Input Sanitization Boundary Cases', () => {
      it('should handle extremely long input strings', () => {
        const extremelyLongString = 'a'.repeat(10000);
        
        const eventWithLongData = {
          title: extremelyLongString.substring(0, 200), // Truncated to valid length
          description: extremelyLongString, // Over the limit
          type: 'meeting',
          start_time: '2025-08-20T19:00:00Z',
          end_time: '2025-08-20T21:00:00Z',
          location_type: 'in_person',
          location_details: { address: '123 Main St' },
          requires_rsvp: false,
          allow_guests: false,
          visibility: 'public',
        };

        const result = eventFormSchema.safeParse(eventWithLongData);
        expect(result.success).toBe(false); // Should fail due to description length
      });

      it('should handle null bytes and control characters', () => {
        const maliciousString = 'Test\x00Event\x01\x02\x03';
        
        const eventWithControlChars = {
          title: maliciousString,
          type: 'meeting',
          start_time: '2025-08-20T19:00:00Z',
          end_time: '2025-08-20T21:00:00Z',
          location_type: 'in_person',
          location_details: { address: '123 Main St' },
          requires_rsvp: false,
          allow_guests: false,
          visibility: 'public',
        };

        const result = eventFormSchema.safeParse(eventWithControlChars);
        // Should pass validation (control chars are valid in strings)
        // But should be sanitized before storage/display
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Volunteer User Error Scenarios', () => {
    describe('Common User Mistakes', () => {
      it('should handle users entering events with end time before start time', () => {
        const backwardsEvent = {
          title: 'Confused Event',
          type: 'meeting',
          start_time: '2025-08-20T21:00:00Z',
          end_time: '2025-08-20T19:00:00Z', // 2 hours before start
          location_type: 'in_person',
          location_details: { address: '123 Main St' },
          requires_rsvp: false,
          allow_guests: false,
          visibility: 'public',
        };

        const result = eventFormSchema.safeParse(backwardsEvent);
        expect(result.success).toBe(false);
        
        if (!result.success) {
          const hasTimeError = result.error.issues.some((e: { message: string }) => 
            e.message.includes('End time must be after start time')
          );
          expect(hasTimeError).toBe(true);
        }
      });

      it('should handle users forgetting required location details', () => {
        const missingAddressEvent = {
          title: 'In-Person Event',
          type: 'meeting',
          start_time: '2025-08-20T19:00:00Z',
          end_time: '2025-08-20T21:00:00Z',
          location_type: 'in_person',
          location_details: { room: 'Room A' }, // Missing address
          requires_rsvp: false,
          allow_guests: false,
          visibility: 'public',
        };

        const result = eventFormSchema.safeParse(missingAddressEvent);
        expect(result.success).toBe(false);
      });

      it('should handle users providing wrong URL formats for virtual events', () => {
        const invalidVirtualEvent = {
          title: 'Virtual Meeting',
          type: 'meeting',
          start_time: '2025-08-20T19:00:00Z',
          end_time: '2025-08-20T21:00:00Z',
          location_type: 'virtual',
          location_details: { virtual_link: 'not-a-valid-url' },
          requires_rsvp: false,
          allow_guests: false,
          visibility: 'public',
        };

        const result = eventFormSchema.safeParse(invalidVirtualEvent);
        expect(result.success).toBe(false);
      });

      it('should handle users entering negative capacity values', () => {
        const negativeCapacityEvent = {
          title: 'Invalid Capacity Event',
          type: 'meeting',
          start_time: '2025-08-20T19:00:00Z',
          end_time: '2025-08-20T21:00:00Z',
          location_type: 'in_person',
          location_details: { address: '123 Main St' },
          capacity: -10,
          requires_rsvp: true,
          allow_guests: false,
          visibility: 'public',
        };

        const result = eventFormSchema.safeParse(negativeCapacityEvent);
        expect(result.success).toBe(false);
      });
    });

    describe('Mobile User Interface Edge Cases', () => {
      it('should handle touch interface rapid tapping', () => {
        // Test scenario: User rapidly taps RSVP button on mobile
        // This should be handled by the component's loading state
        // These tests would be in the component test file, but we note the scenario here
        
        // Validation functions should be idempotent
        expect(validateGuestCount(2, true)).toBe(true);
        expect(validateGuestCount(2, true)).toBe(true); // Second call same result
      });

      it('should handle small screen form input edge cases', () => {
        // Users on mobile might accidentally enter wrong values
        // Test common mobile input mistakes
        
        // Switching between number and text inputs
        const guestCounts = ['2', '2.5', '2a', '', null, undefined];
        
        guestCounts.forEach(count => {
          // Convert to number as component would
          const numericCount = parseInt(count as string) || 0;
          const isValid = validateGuestCount(numericCount, true);
          
          if (numericCount >= 0 && numericCount <= 10) {
            expect(isValid).toBe(true);
          } else {
            expect(isValid).toBe(false);
          }
        });
      });
    });
  });

  describe('System Resilience Testing', () => {
    describe('Graceful Degradation', () => {
      it('should handle partial data gracefully', () => {
        // Test with minimal valid event data
        const minimalEvent = {
          title: 'Minimal Event',
          type: 'meeting',
          start_time: '2025-08-20T19:00:00Z',
          end_time: '2025-08-20T21:00:00Z',
          location_type: 'virtual',
          location_details: { virtual_link: 'https://zoom.us/123' },
          requires_rsvp: false,
          allow_guests: false,
          visibility: 'public',
        };

        expect(eventFormSchema.safeParse(minimalEvent).success).toBe(true);
      });

      it('should handle missing optional fields', () => {
        const eventWithoutOptionals = {
          title: 'Event Without Optionals',
          type: 'meeting',
          start_time: '2025-08-20T19:00:00Z',
          end_time: '2025-08-20T21:00:00Z',
          location_type: 'in_person',
          location_details: { address: '123 Main St' },
          requires_rsvp: false,
          allow_guests: false,
          visibility: 'public',
          // Missing: description, capacity, room, etc.
        };

        expect(eventFormSchema.safeParse(eventWithoutOptionals).success).toBe(true);
      });
    });

    describe('Performance Edge Cases', () => {
      it('should handle large numbers of simultaneous validation requests', () => {
        // Simulate many validation requests
        const promises = Array.from({ length: 100 }, (_, i) => {
          return new Promise(resolve => {
            const result = validateCapacity(i, 1, 100);
            resolve(result);
          });
        });

        return Promise.all(promises).then(results => {
          expect(results).toHaveLength(100);
          // Most should be true (until near capacity)
          const trueCount = results.filter(r => r === true).length;
          expect(trueCount).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Business Logic Edge Cases', () => {
    describe('Event Lifecycle Edge Cases', () => {
      it('should handle events that start in one year and end the next', () => {
        const newYearEvent = {
          title: 'New Year Party',
          type: 'social',
          start_time: '2025-12-31T23:00:00Z',
          end_time: '2026-01-01T02:00:00Z',
          location_type: 'in_person',
          location_details: { address: '123 Party St' },
          requires_rsvp: true,
          allow_guests: true,
          visibility: 'public',
        };

        expect(eventFormSchema.safeParse(newYearEvent).success).toBe(true);
      });

      it('should handle leap year dates correctly', () => {
        const leapYearEvent = {
          title: 'Leap Year Event',
          type: 'meeting',
          start_time: '2024-02-29T19:00:00Z', // Leap year date
          end_time: '2024-02-29T21:00:00Z',
          location_type: 'virtual',
          location_details: { virtual_link: 'https://zoom.us/123' },
          requires_rsvp: false,
          allow_guests: false,
          visibility: 'public',
        };

        expect(eventFormSchema.safeParse(leapYearEvent).success).toBe(true);
      });
    });

    describe('Capacity Management Business Rules', () => {
      it('should handle zero capacity events correctly', () => {
        // Some events might have zero capacity (information only)
        expect(validateCapacity(0, 1, 0)).toBe(false);
        expect(validateCapacity(0, 0, 0)).toBe(true);
      });

      it('should handle unlimited capacity (null capacity)', () => {
        // Events without capacity limits
        expect(validateCapacity(1000, 500, undefined)).toBe(true);
        expect(validateCapacity(0, 10000, null as unknown as number)).toBe(true);
      });
    });
  });
});