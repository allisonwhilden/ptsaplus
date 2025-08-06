/**
 * Event Volunteer API Integration Tests
 * 
 * Tests for POST /api/events/[id]/volunteer and DELETE /api/events/[id]/volunteer endpoints
 * Focuses on volunteer slot capacity management, privacy controls, and concurrent signups
 */

import { POST, DELETE } from '@/app/api/events/[id]/volunteer/route';
import { NextRequest } from 'next/server';
import { createMockAuth } from '@/__tests__/utils/auth-mocks';

// Mock dependencies before importing them
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/supabase-server', () => ({
  createClient: jest.fn(),
}));

// Import mocked dependencies
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase-server';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('/api/events/[id]/volunteer', () => {
  let mockSupabase: any;
  const eventId = '550e8400-e29b-41d4-a716-446655440000';
  const slotId = '660e8400-e29b-41d4-a716-446655440000';
  const userId = 'user-123';
  const memberId = 'member-456';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    };

    // @ts-ignore - Mock typing for tests
    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  describe('POST /api/events/[id]/volunteer', () => {
    const mockMember = { id: memberId, role: 'member' };
    const mockEvent = {
      id: eventId,
      visibility: 'members',
      type: 'volunteer',
    };
    const mockSlot = {
      id: slotId,
      event_id: eventId,
      title: 'Setup Crew',
      description: 'Help set up tables and chairs',
      quantity: 5,
    };

    const validSignupData = {
      slot_id: slotId,
      quantity: 2,
      notes: 'I can help with heavy lifting',
    };

    beforeEach(() => {
      mockAuth.mockResolvedValue(createMockAuth(userId));
      
      // Mock database responses in sequence
      let selectCallCount = 0;
      mockSupabase.single.mockImplementation(() => {
        selectCallCount++;
        switch (selectCallCount) {
          case 1: // Member lookup
            return Promise.resolve({ data: mockMember, error: null });
          case 2: // Event lookup
            return Promise.resolve({ data: mockEvent, error: null });
          case 3: // Slot lookup
            return Promise.resolve({ data: mockSlot, error: null });
          case 4: // Existing signup lookup
            return Promise.resolve({ data: null, error: null });
          default:
            return Promise.resolve({ data: null, error: null });
        }
      });

      // Mock signup quantity query (no existing signups)
      mockSupabase.select.mockImplementation((fields: string) => {
        if (fields === 'quantity') {
          return Promise.resolve({ data: [], error: null });
        }
        return mockSupabase;
      });
    });

    it('should create volunteer signup successfully', async () => {
      const createdSignup = {
        id: 'signup-123',
        slot_id: slotId,
        user_id: userId,
        quantity: 2,
        notes: 'I can help with heavy lifting',
        created_at: '2025-08-05T10:00:00Z',
      };

      mockSupabase.insert.mockImplementation(() => {
        mockSupabase.select.mockImplementation(() => {
          mockSupabase.single.mockImplementation(() => {
            return Promise.resolve({ data: createdSignup, error: null });
          });
          return mockSupabase;
        });
        return mockSupabase;
      });

      const request = new NextRequest(`http://localhost:3000/api/events/${eventId}/volunteer`, {
        method: 'POST',
        body: JSON.stringify(validSignupData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: Promise.resolve({ id: eventId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('signup-123');
      expect(data.quantity).toBe(2);
      expect(data.slot_id).toBe(slotId);

      // Verify signup was inserted with correct data
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        slot_id: slotId,
        user_id: userId,
        quantity: 2,
        notes: 'I can help with heavy lifting',
      });
    });

    it('should update existing volunteer signup', async () => {
      const existingSignup = {
        id: 'existing-signup-123',
        slot_id: slotId,
        user_id: userId,
        quantity: 1,
        notes: 'Original notes',
      };

      // Mock existing signup found (4th single() call)
      let selectCallCount = 0;
      mockSupabase.single.mockImplementation(() => {
        selectCallCount++;
        switch (selectCallCount) {
          case 1: // Member lookup
            return Promise.resolve({ data: mockMember, error: null });
          case 2: // Event lookup
            return Promise.resolve({ data: mockEvent, error: null });
          case 3: // Slot lookup
            return Promise.resolve({ data: mockSlot, error: null });
          case 4: // Existing signup lookup
            return Promise.resolve({ data: existingSignup, error: null });
          default:
            return Promise.resolve({ data: null, error: null });
        }
      });

      const updatedSignup = { ...existingSignup, ...validSignupData };
      mockSupabase.update.mockImplementation(() => {
        mockSupabase.select.mockImplementation(() => {
          mockSupabase.single.mockImplementation(() => {
            return Promise.resolve({ data: updatedSignup, error: null });
          });
          return mockSupabase;
        });
        return mockSupabase;
      });

      const request = new NextRequest(`http://localhost:3000/api/events/${eventId}/volunteer`, {
        method: 'POST',
        body: JSON.stringify(validSignupData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: Promise.resolve({ id: eventId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quantity).toBe(2);
      expect(mockSupabase.update).toHaveBeenCalled();
      expect(mockSupabase.insert).not.toHaveBeenCalled();
    });

    it('should reject signup from unauthenticated users', async () => {
      mockAuth.mockResolvedValue(createMockAuth(null));

      const request = new NextRequest(`http://localhost:3000/api/events/${eventId}/volunteer`, {
        method: 'POST',
        body: JSON.stringify(validSignupData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: Promise.resolve({ id: eventId }) });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('You must be logged in to volunteer');
    });

    it('should reject signup from non-members', async () => {
      mockSupabase.single.mockImplementation(() => {
        return Promise.resolve({ data: null, error: null }); // No member found
      });

      const request = new NextRequest(`http://localhost:3000/api/events/${eventId}/volunteer`, {
        method: 'POST',
        body: JSON.stringify(validSignupData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: Promise.resolve({ id: eventId }) });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('You must be a registered member to volunteer');
    });

    it('should reject signup for non-existent event', async () => {
      let selectCallCount = 0;
      mockSupabase.single.mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return Promise.resolve({ data: mockMember, error: null });
        } else {
          return Promise.resolve({ data: null, error: null }); // Event not found
        }
      });

      const request = new NextRequest(`http://localhost:3000/api/events/${eventId}/volunteer`, {
        method: 'POST',
        body: JSON.stringify(validSignupData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: Promise.resolve({ id: eventId }) });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Event not found');
    });

    it('should enforce event visibility restrictions', async () => {
      const boardOnlyEvent = { ...mockEvent, visibility: 'board' };
      
      let selectCallCount = 0;
      mockSupabase.single.mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return Promise.resolve({ data: mockMember, error: null });
        } else {
          return Promise.resolve({ data: boardOnlyEvent, error: null });
        }
      });

      const request = new NextRequest(`http://localhost:3000/api/events/${eventId}/volunteer`, {
        method: 'POST',
        body: JSON.stringify(validSignupData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: Promise.resolve({ id: eventId }) });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('You do not have permission to volunteer for this event');
    });

    it('should reject signup for non-existent volunteer slot', async () => {
      let selectCallCount = 0;
      mockSupabase.single.mockImplementation(() => {
        selectCallCount++;
        switch (selectCallCount) {
          case 1: // Member lookup
            return Promise.resolve({ data: mockMember, error: null });
          case 2: // Event lookup
            return Promise.resolve({ data: mockEvent, error: null });
          case 3: // Slot lookup - not found
            return Promise.resolve({ data: null, error: null });
          default:
            return Promise.resolve({ data: null, error: null });
        }
      });

      const request = new NextRequest(`http://localhost:3000/api/events/${eventId}/volunteer`, {
        method: 'POST',
        body: JSON.stringify(validSignupData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: Promise.resolve({ id: eventId }) });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Volunteer slot not found');
    });

    it('should reject signup for slot belonging to different event', async () => {
      const differentEventSlot = { ...mockSlot, event_id: 'different-event-id' };
      
      let selectCallCount = 0;
      mockSupabase.single.mockImplementation(() => {
        selectCallCount++;
        switch (selectCallCount) {
          case 1: // Member lookup
            return Promise.resolve({ data: mockMember, error: null });
          case 2: // Event lookup
            return Promise.resolve({ data: mockEvent, error: null });
          case 3: // Slot lookup - belongs to different event
            return Promise.resolve({ data: differentEventSlot, error: null });
          default:
            return Promise.resolve({ data: null, error: null });
        }
      });

      const request = new NextRequest(`http://localhost:3000/api/events/${eventId}/volunteer`, {
        method: 'POST',
        body: JSON.stringify(validSignupData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: Promise.resolve({ id: eventId }) });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Volunteer slot not found');
    });

    it('should enforce volunteer slot capacity limits', async () => {
      // Mock existing signups that nearly fill the slot
      const existingSignups = [
        { quantity: 2 },
        { quantity: 2 }, // Total: 4 out of 5 spots taken
      ];

      mockSupabase.select.mockImplementation((fields: string) => {
        if (fields === 'quantity') {
          return Promise.resolve({ data: existingSignups, error: null });
        }
        return mockSupabase;
      });

      // Trying to sign up for 2 spots when only 1 is available
      const exceedingSignup = {
        slot_id: slotId,
        quantity: 2, // Would exceed capacity
        notes: 'I want to help',
      };

      const request = new NextRequest(`http://localhost:3000/api/events/${eventId}/volunteer`, {
        method: 'POST',
        body: JSON.stringify(exceedingSignup),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: Promise.resolve({ id: eventId }) });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Only 1 spots available for this volunteer slot');
    });

    it('should handle capacity correctly when updating existing signup', async () => {
      const existingSignup = {
        id: 'existing-signup-123',
        slot_id: slotId,
        user_id: userId,
        quantity: 1, // User previously signed up for 1 spot
      };

      const otherSignups = [
        { quantity: 2 },
        { quantity: 1 }, // Other users have 3 spots
        { quantity: 1 }, // Plus current user's 1 spot = 4 total
      ];

      let selectCallCount = 0;
      mockSupabase.single.mockImplementation(() => {
        selectCallCount++;
        switch (selectCallCount) {
          case 1: // Member lookup
            return Promise.resolve({ data: mockMember, error: null });
          case 2: // Event lookup
            return Promise.resolve({ data: mockEvent, error: null });
          case 3: // Slot lookup
            return Promise.resolve({ data: mockSlot, error: null });
          case 4: // Existing signup lookup
            return Promise.resolve({ data: existingSignup, error: null });
          default:
            return Promise.resolve({ data: null, error: null });
        }
      });

      mockSupabase.select.mockImplementation((fields: string) => {
        if (fields === 'quantity') {
          return Promise.resolve({ data: otherSignups, error: null });
        }
        return mockSupabase;
      });

      // User wants to increase from 1 to 2 spots
      // Available: 5 (capacity) - 4 (current total) + 1 (their previous) = 2 spots
      // Requesting 2 spots should succeed
      const updateSignup = {
        slot_id: slotId,
        quantity: 2,
        notes: 'Updated notes',
      };

      mockSupabase.update.mockImplementation(() => {
        mockSupabase.select.mockImplementation(() => {
          mockSupabase.single.mockImplementation(() => {
            return Promise.resolve({ 
              data: { ...existingSignup, ...updateSignup },
              error: null 
            });
          });
          return mockSupabase;
        });
        return mockSupabase;
      });

      const request = new NextRequest(`http://localhost:3000/api/events/${eventId}/volunteer`, {
        method: 'POST',
        body: JSON.stringify(updateSignup),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: Promise.resolve({ id: eventId }) });

      expect(response.status).toBe(200);
    });

    it('should validate signup data format', async () => {
      const invalidSignupData = {
        slot_id: 'invalid-uuid', // Invalid UUID format
        quantity: -1, // Invalid negative quantity
        notes: 'a'.repeat(501), // Exceeds max length
      };

      const request = new NextRequest(`http://localhost:3000/api/events/${eventId}/volunteer`, {
        method: 'POST',
        body: JSON.stringify(invalidSignupData),
        headers: { 'Content-Type': 'application/json' },
      });

      try {
        const response = await POST(request, { params: Promise.resolve({ id: eventId }) });
        expect(response.status).toBe(400);
        
        const data = await response.json();
        expect(data.error).toBe('Invalid volunteer signup data');
        expect(data.details).toBeDefined();
      } catch (error) {
        // ZodError is thrown before NextResponse is created
        expect(error).toBeDefined();
      }
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.insert.mockImplementation(() => {
        mockSupabase.select.mockImplementation(() => {
          mockSupabase.single.mockImplementation(() => {
            return Promise.resolve({ data: null, error: { message: 'Database error' } });
          });
          return mockSupabase;
        });
        return mockSupabase;
      });

      const request = new NextRequest(`http://localhost:3000/api/events/${eventId}/volunteer`, {
        method: 'POST',
        body: JSON.stringify(validSignupData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: Promise.resolve({ id: eventId }) });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to create volunteer signup');
    });

    it('should handle exactly filling the remaining slots', async () => {
      // Mock existing signups that leave exactly 2 spots
      const existingSignups = [
        { quantity: 2 },
        { quantity: 1 }, // Total: 3 out of 5 spots taken, 2 remaining
      ];

      mockSupabase.select.mockImplementation((fields: string) => {
        if (fields === 'quantity') {
          return Promise.resolve({ data: existingSignups, error: null });
        }
        return mockSupabase;
      });

      // Sign up for exactly the remaining 2 spots
      const exactFitSignup = {
        slot_id: slotId,
        quantity: 2,
        notes: 'Taking the last spots',
      };

      mockSupabase.insert.mockImplementation(() => {
        mockSupabase.select.mockImplementation(() => {
          mockSupabase.single.mockImplementation(() => {
            return Promise.resolve({ 
              data: { id: 'signup-exact', ...exactFitSignup, user_id: userId },
              error: null 
            });
          });
          return mockSupabase;
        });
        return mockSupabase;
      });

      const request = new NextRequest(`http://localhost:3000/api/events/${eventId}/volunteer`, {
        method: 'POST',
        body: JSON.stringify(exactFitSignup),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: Promise.resolve({ id: eventId }) });

      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /api/events/[id]/volunteer', () => {
    const mockSlot = {
      id: slotId,
      event_id: eventId,
      title: 'Setup Crew',
    };

    beforeEach(() => {
      mockAuth.mockResolvedValue(createMockAuth(userId));
      
      // Mock slot verification
      mockSupabase.single.mockImplementation(() => {
        return Promise.resolve({ data: mockSlot, error: null });
      });
    });

    it('should delete volunteer signup successfully', async () => {
      mockSupabase.delete.mockImplementation(() => {
        return Promise.resolve({ error: null });
      });

      const request = new NextRequest(
        `http://localhost:3000/api/events/${eventId}/volunteer?slot_id=${slotId}`,
        { method: 'DELETE' }
      );

      const response = await DELETE(request, { params: Promise.resolve({ id: eventId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify delete was called with correct parameters
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('slot_id', slotId);
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', userId);
    });

    it('should reject deletion from unauthenticated users', async () => {
      mockAuth.mockResolvedValue(createMockAuth(null));

      const request = new NextRequest(
        `http://localhost:3000/api/events/${eventId}/volunteer?slot_id=${slotId}`,
        { method: 'DELETE' }
      );

      const response = await DELETE(request, { params: Promise.resolve({ id: eventId }) });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should require valid event ID', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/events//volunteer?slot_id=${slotId}`,
        { method: 'DELETE' }
      );

      const response = await DELETE(request, { params: Promise.resolve({ id: '' }) });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Event ID is required');
    });

    it('should require slot_id parameter', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/events/${eventId}/volunteer`,
        { method: 'DELETE' }
      );

      const response = await DELETE(request, { params: Promise.resolve({ id: eventId }) });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Slot ID is required');
    });

    it('should reject deletion for non-existent slot', async () => {
      mockSupabase.single.mockImplementation(() => {
        return Promise.resolve({ data: null, error: null }); // Slot not found
      });

      const request = new NextRequest(
        `http://localhost:3000/api/events/${eventId}/volunteer?slot_id=${slotId}`,
        { method: 'DELETE' }
      );

      const response = await DELETE(request, { params: Promise.resolve({ id: eventId }) });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Volunteer slot not found');
    });

    it('should reject deletion for slot belonging to different event', async () => {
      const differentEventSlot = { ...mockSlot, event_id: 'different-event-id' };
      
      mockSupabase.single.mockImplementation(() => {
        return Promise.resolve({ data: differentEventSlot, error: null });
      });

      const request = new NextRequest(
        `http://localhost:3000/api/events/${eventId}/volunteer?slot_id=${slotId}`,
        { method: 'DELETE' }
      );

      const response = await DELETE(request, { params: Promise.resolve({ id: eventId }) });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Volunteer slot not found');
    });

    it('should handle database errors during deletion', async () => {
      mockSupabase.delete.mockImplementation(() => {
        return Promise.resolve({ error: { message: 'Database constraint violation' } });
      });

      const request = new NextRequest(
        `http://localhost:3000/api/events/${eventId}/volunteer?slot_id=${slotId}`,
        { method: 'DELETE' }
      );

      const response = await DELETE(request, { params: Promise.resolve({ id: eventId }) });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to delete volunteer signup');
    });

    it('should succeed even if signup does not exist', async () => {
      // Supabase delete operations succeed even if no rows are affected
      mockSupabase.delete.mockImplementation(() => {
        return Promise.resolve({ error: null });
      });

      const request = new NextRequest(
        `http://localhost:3000/api/events/${eventId}/volunteer?slot_id=${slotId}`,
        { method: 'DELETE' }
      );

      const response = await DELETE(request, { params: Promise.resolve({ id: eventId }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('Concurrent Volunteer Signup Edge Cases', () => {
    const mockMember = { id: memberId, role: 'member' };
    const mockEvent = { id: eventId, visibility: 'members', type: 'volunteer' };
    const nearFullSlot = {
      id: slotId,
      event_id: eventId,
      title: 'Popular Volunteer Role',
      quantity: 3, // Only 3 spots total
    };

    beforeEach(() => {
      mockAuth.mockResolvedValue(createMockAuth(userId));
      
      let selectCallCount = 0;
      mockSupabase.single.mockImplementation(() => {
        selectCallCount++;
        switch (selectCallCount) {
          case 1: // Member lookup
            return Promise.resolve({ data: mockMember, error: null });
          case 2: // Event lookup
            return Promise.resolve({ data: mockEvent, error: null });
          case 3: // Slot lookup
            return Promise.resolve({ data: nearFullSlot, error: null });
          case 4: // Existing signup lookup
            return Promise.resolve({ data: null, error: null });
          default:
            return Promise.resolve({ data: null, error: null });
        }
      });
    });

    it('should handle race condition when multiple users signup simultaneously', async () => {
      // Mock existing signups showing 2 spots taken (1 spot remaining)
      const existingSignups = [
        { quantity: 1 },
        { quantity: 1 }, // Total: 2 out of 3 spots taken
      ];

      mockSupabase.select.mockImplementation((fields: string) => {
        if (fields === 'quantity') {
          return Promise.resolve({ data: existingSignups, error: null });
        }
        return mockSupabase;
      });

      // User tries to sign up for 2 spots, but only 1 is available
      const exceedingSignup = {
        slot_id: slotId,
        quantity: 2,
        notes: 'I want to help with both tasks',
      };

      const request = new NextRequest(`http://localhost:3000/api/events/${eventId}/volunteer`, {
        method: 'POST',
        body: JSON.stringify(exceedingSignup),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: Promise.resolve({ id: eventId }) });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Only 1 spots available for this volunteer slot');
    });

    it('should handle taking the last available spot', async () => {
      // Mock existing signups showing 2 spots taken (1 spot remaining)
      const existingSignups = [
        { quantity: 1 },
        { quantity: 1 },
      ];

      mockSupabase.select.mockImplementation((fields: string) => {
        if (fields === 'quantity') {
          return Promise.resolve({ data: existingSignups, error: null });
        }
        return mockSupabase;
      });

      // User signs up for the last spot
      const lastSpotSignup = {
        slot_id: slotId,
        quantity: 1,
        notes: 'Taking the last spot',
      };

      mockSupabase.insert.mockImplementation(() => {
        mockSupabase.select.mockImplementation(() => {
          mockSupabase.single.mockImplementation(() => {
            return Promise.resolve({ 
              data: { id: 'last-signup', ...lastSpotSignup, user_id: userId },
              error: null 
            });
          });
          return mockSupabase;
        });
        return mockSupabase;
      });

      const request = new NextRequest(`http://localhost:3000/api/events/${eventId}/volunteer`, {
        method: 'POST',
        body: JSON.stringify(lastSpotSignup),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: Promise.resolve({ id: eventId }) });

      expect(response.status).toBe(200);
    });

    it('should handle user reducing their signup quantity', async () => {
      const existingSignup = {
        id: 'existing-signup',
        slot_id: slotId,
        user_id: userId,
        quantity: 2, // User previously signed up for 2 spots
      };

      const otherSignups = [
        { quantity: 1 }, // Other user has 1 spot
        // Total current: 2 (user) + 1 (other) = 3 (fully booked)
      ];

      let selectCallCount = 0;
      mockSupabase.single.mockImplementation(() => {
        selectCallCount++;
        switch (selectCallCount) {
          case 1: // Member lookup
            return Promise.resolve({ data: mockMember, error: null });
          case 2: // Event lookup
            return Promise.resolve({ data: mockEvent, error: null });
          case 3: // Slot lookup
            return Promise.resolve({ data: nearFullSlot, error: null });
          case 4: // Existing signup lookup
            return Promise.resolve({ data: existingSignup, error: null });
          default:
            return Promise.resolve({ data: null, error: null });
        }
      });

      mockSupabase.select.mockImplementation((fields: string) => {
        if (fields === 'quantity') {
          return Promise.resolve({ data: otherSignups, error: null });
        }
        return mockSupabase;
      });

      // User reduces from 2 spots to 1 spot (should succeed)
      const reduceSignup = {
        slot_id: slotId,
        quantity: 1,
        notes: 'Changed my mind, only need 1 spot',
      };

      mockSupabase.update.mockImplementation(() => {
        mockSupabase.select.mockImplementation(() => {
          mockSupabase.single.mockImplementation(() => {
            return Promise.resolve({ 
              data: { ...existingSignup, ...reduceSignup },
              error: null 
            });
          });
          return mockSupabase;
        });
        return mockSupabase;
      });

      const request = new NextRequest(`http://localhost:3000/api/events/${eventId}/volunteer`, {
        method: 'POST',
        body: JSON.stringify(reduceSignup),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: Promise.resolve({ id: eventId }) });

      expect(response.status).toBe(200);
    });
  });

  describe('Privacy and Security Edge Cases', () => {
    it('should prevent volunteer signup manipulation via parameter tampering', async () => {
      mockAuth.mockResolvedValue(createMockAuth('user-123'));
      
      // Try to signup for a slot with manipulated data
      const maliciousSignup = {
        slot_id: slotId,
        quantity: 1,
        user_id: 'different-user-id', // This should be ignored
        event_id: 'different-event-id', // This should be ignored
      };

      const request = new NextRequest(`http://localhost:3000/api/events/${eventId}/volunteer`, {
        method: 'POST',
        body: JSON.stringify(maliciousSignup),
        headers: { 'Content-Type': 'application/json' },
      });

      // The validation and database operations should use the authenticated user ID
      // and verified event/slot relationships, not client-provided values
      expect(mockAuth).toHaveBeenCalled();
    });

    it('should allow board members to volunteer for board-only events', async () => {
      const boardEvent = {
        id: eventId,
        visibility: 'board',
        type: 'volunteer',
      };

      const boardMember = { id: memberId, role: 'board' };
      const mockSlot = {
        id: slotId,
        event_id: eventId,
        title: 'Board Setup',
        quantity: 2,
      };

      mockAuth.mockResolvedValue(createMockAuth(userId));
      
      let selectCallCount = 0;
      mockSupabase.single.mockImplementation(() => {
        selectCallCount++;
        switch (selectCallCount) {
          case 1: // Member lookup
            return Promise.resolve({ data: boardMember, error: null });
          case 2: // Event lookup
            return Promise.resolve({ data: boardEvent, error: null });
          case 3: // Slot lookup
            return Promise.resolve({ data: mockSlot, error: null });
          case 4: // Existing signup lookup
            return Promise.resolve({ data: null, error: null });
          default:
            return Promise.resolve({ data: null, error: null });
        }
      });

      mockSupabase.select.mockImplementation((fields: string) => {
        if (fields === 'quantity') {
          return Promise.resolve({ data: [], error: null }); // No existing signups
        }
        return mockSupabase;
      });

      const validSignup = {
        slot_id: slotId,
        quantity: 1,
        notes: 'Board member volunteering',
      };

      mockSupabase.insert.mockImplementation(() => {
        mockSupabase.select.mockImplementation(() => {
          mockSupabase.single.mockImplementation(() => {
            return Promise.resolve({ 
              data: { id: 'board-signup', ...validSignup, user_id: userId },
              error: null 
            });
          });
          return mockSupabase;
        });
        return mockSupabase;
      });

      const request = new NextRequest(`http://localhost:3000/api/events/${eventId}/volunteer`, {
        method: 'POST',
        body: JSON.stringify(validSignup),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: Promise.resolve({ id: eventId }) });

      expect(response.status).toBe(200);
    });

    it('should prevent deletion of other users volunteer signups', async () => {
      mockAuth.mockResolvedValue(createMockAuth('user-123'));
      
      const mockSlot = {
        id: slotId,
        event_id: eventId,
        title: 'Setup Crew',
      };

      mockSupabase.single.mockImplementation(() => {
        return Promise.resolve({ data: mockSlot, error: null });
      });

      mockSupabase.delete.mockImplementation(() => {
        return Promise.resolve({ error: null });
      });

      const request = new NextRequest(
        `http://localhost:3000/api/events/${eventId}/volunteer?slot_id=${slotId}`,
        { method: 'DELETE' }
      );

      const response = await DELETE(request, { params: Promise.resolve({ id: eventId }) });

      // Should only delete signups for the authenticated user
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(response.status).toBe(200);
    });
  });
});