/**
 * Privacy Settings API Tests
 * Tests for FERPA/COPPA compliant privacy controls
 */

import { NextRequest } from 'next/server';
import { GET, PUT } from '@/app/api/privacy/settings/route';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/config/supabase';

// Mock dependencies
jest.mock('@/lib/privacy/audit');

describe('Privacy Settings API', () => {
  const mockAuth = auth as jest.MockedFunction<typeof auth>;
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/privacy/settings', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);

      const request = new NextRequest('http://localhost:3000/api/privacy/settings');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return existing privacy settings for authenticated user', async () => {
      const userId = 'user_123';
      const mockSettings = {
        id: 'settings_123',
        user_id: userId,
        show_email: false,
        show_phone: false,
        show_address: false,
        show_children: false,
        directory_visible: true,
        allow_photo_sharing: false,
        allow_data_sharing: false,
      };

      mockAuth.mockResolvedValue({ userId } as any);
      
      // Setup the mock to return the right data
      const mockFrom = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: mockSettings, error: null })
      }));
      
      mockCreateClient.mockReturnValue({
        from: mockFrom
      } as any);

      const request = new NextRequest('http://localhost:3000/api/privacy/settings');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockSettings);
      expect(mockFrom).toHaveBeenCalledWith('privacy_settings');
    });

    it('should create default settings if none exist', async () => {
      const userId = 'user_123';
      const newSettings = {
        id: 'settings_new',
        user_id: userId,
        show_email: false,
        show_phone: false,
        show_address: false,
        show_children: false,
        directory_visible: true,
        allow_photo_sharing: false,
        allow_data_sharing: false,
      };

      mockAuth.mockResolvedValue({ userId } as any);
      
      // We need to mock two different chains - one for select, one for insert
      let callCount = 0;
      const mockFrom = jest.fn(() => {
        callCount++;
        const insertMock = jest.fn().mockReturnThis();
        const chain: any = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          insert: insertMock,
          update: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          then: (resolve: any) => {
            if (callCount === 1) {
              // First call - select returns no data
              resolve({ data: null, error: { code: 'PGRST116' } });
            } else {
              // Second call - insert returns new settings
              resolve({ data: newSettings, error: null });
            }
          }
        };
        // Store for later assertion
        if (callCount === 2) {
          chain._insertMock = insertMock;
        }
        return chain;
      });

      mockCreateClient.mockReturnValue({
        from: mockFrom
      } as any);

      const request = new NextRequest('http://localhost:3000/api/privacy/settings');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(newSettings);
      expect(mockFrom).toHaveBeenCalledTimes(2);
    });
  });

  describe('PUT /api/privacy/settings', () => {
    it('should update privacy settings for authenticated user', async () => {
      const userId = 'user_123';
      const updateData = {
        show_email: true,
        show_phone: true,
        directory_visible: false,
      };

      const currentSettings = {
        id: 'settings_123',
        user_id: userId,
        show_email: false,
        show_phone: false,
        directory_visible: true,
      };

      const updatedSettings = {
        ...currentSettings,
        ...updateData,
      };

      mockAuth.mockResolvedValue({ userId } as any);
      
      // Mock two calls - one for select, one for update
      let callCount = 0;
      const mockFrom = jest.fn(() => {
        callCount++;
        const updateMock = jest.fn().mockReturnThis();
        const chain: any = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          update: updateMock,
          single: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          then: (resolve: any) => {
            if (callCount === 1) {
              resolve({ data: currentSettings, error: null });
            } else {
              resolve({ data: updatedSettings, error: null });
            }
          }
        };
        // Store for later assertion
        if (callCount === 2) {
          chain._updateMock = updateMock;
        }
        return chain;
      });

      mockCreateClient.mockReturnValue({
        from: mockFrom
      } as any);

      const request = new NextRequest('http://localhost:3000/api/privacy/settings', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(updatedSettings);
      expect(mockFrom).toHaveBeenCalledTimes(2);
    });

    it('should validate and filter invalid fields', async () => {
      const userId = 'user_123';
      const invalidData = {
        show_email: true,
        invalid_field: 'should be ignored',
        user_id: 'should not be changeable',
        id: 'should not be changeable',
      };

      mockAuth.mockResolvedValue({ userId } as any);

      // Mock two calls for this test
      let callCount = 0;
      const mockFrom = jest.fn(() => {
        callCount++;
        const updateMock = jest.fn().mockReturnThis();
        const chain: any = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          update: updateMock,
          single: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          then: (resolve: any) => {
            if (callCount === 1) {
              resolve({ data: { id: 'settings_123', user_id: userId }, error: null });
            } else {
              resolve({ data: { id: 'settings_123', user_id: userId, show_email: true }, error: null });
            }
          }
        };
        return chain;
      });

      mockCreateClient.mockReturnValue({
        from: mockFrom
      } as any);

      const request = new NextRequest('http://localhost:3000/api/privacy/settings', {
        method: 'PUT',
        body: JSON.stringify(invalidData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
      expect(mockFrom).toHaveBeenCalledTimes(2);
    });

    it('should return 400 for invalid boolean values', async () => {
      const userId = 'user_123';
      const invalidData = {
        show_email: 'not a boolean',
        show_phone: 123,
      };

      mockAuth.mockResolvedValue({ userId } as any);

      const request = new NextRequest('http://localhost:3000/api/privacy/settings', {
        method: 'PUT',
        body: JSON.stringify(invalidData),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('No valid fields to update');
    });
  });

  describe('Privacy Field Visibility', () => {
    it('should respect field visibility settings', () => {
      const { getFieldVisibility } = require('@/lib/privacy/types');
      
      const settings = {
        showEmail: false,
        showPhone: true,
        showAddress: false,
        showChildren: true,
      };

      const visibility = getFieldVisibility(settings, 'member');
      
      expect(visibility.email).toBe(false);
      expect(visibility.phone).toBe(true);
      expect(visibility.address).toBe(false);
      expect(visibility.children).toBe(true);
    });

    it('should allow admins to see all fields', () => {
      const { getFieldVisibility } = require('@/lib/privacy/types');
      
      const settings = {
        showEmail: false,
        showPhone: false,
        showAddress: false,
        showChildren: false,
      };

      const adminVisibility = getFieldVisibility(settings, 'admin');
      const boardVisibility = getFieldVisibility(settings, 'board');
      
      expect(adminVisibility.email).toBe(true);
      expect(adminVisibility.phone).toBe(true);
      expect(boardVisibility.email).toBe(true);
      expect(boardVisibility.phone).toBe(true);
    });
  });
});