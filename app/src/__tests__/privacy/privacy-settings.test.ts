/**
 * Privacy Settings API Tests
 * Tests for FERPA/COPPA compliant privacy controls
 */

import { NextRequest } from 'next/server';
import { GET, PUT } from '@/app/api/privacy/settings/route';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/config/supabase';

// Mock dependencies
jest.mock('@clerk/nextjs/server');
jest.mock('@/config/supabase');
jest.mock('@/lib/privacy/audit');

describe('Privacy Settings API', () => {
  const mockAuth = auth as jest.MockedFunction<typeof auth>;
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
  
  const mockSupabase = {
    from: jest.fn(() => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        data: null as any,
        error: null as any,
      };
      // Make the chain itself a thenable (awaitable)
      (chain as any).then = (resolve: any) => {
        resolve({ data: chain.data, error: chain.error });
      };
      return chain;
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockReturnValue(mockSupabase as any);
  });

  describe('GET /api/privacy/settings', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockReturnValue({ userId: null } as any);

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

      mockAuth.mockReturnValue({ userId } as any);
      const mockChain = mockSupabase.from();
      mockChain.single.mockResolvedValueOnce({
        data: mockSettings,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/privacy/settings');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockSettings);
      expect(mockSupabase.from).toHaveBeenCalledWith('privacy_settings');
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

      mockAuth.mockReturnValue({ userId } as any);
      
      const mockChain = mockSupabase.from();
      // First call returns no data (PGRST116 error)
      mockChain.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Insert call creates new settings
      mockChain.single.mockResolvedValueOnce({
        data: newSettings,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/privacy/settings');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(newSettings);
      expect(mockSupabase.from().insert).toHaveBeenCalled();
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

      mockAuth.mockReturnValue({ userId } as any);
      
      const mockChain = mockSupabase.from();
      // Get current settings
      mockChain.single.mockResolvedValueOnce({
        data: currentSettings,
        error: null,
      });

      // Update settings
      mockChain.single.mockResolvedValueOnce({
        data: updatedSettings,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/privacy/settings', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(updatedSettings);
      expect(mockSupabase.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          show_email: true,
          show_phone: true,
          directory_visible: false,
        })
      );
    });

    it('should validate and filter invalid fields', async () => {
      const userId = 'user_123';
      const invalidData = {
        show_email: true,
        invalid_field: 'should be ignored',
        user_id: 'should not be changeable',
        id: 'should not be changeable',
      };

      mockAuth.mockReturnValue({ userId } as any);

      const request = new NextRequest('http://localhost:3000/api/privacy/settings', {
        method: 'PUT',
        body: JSON.stringify(invalidData),
      });

      const mockChain = mockSupabase.from();
      mockChain.single.mockResolvedValueOnce({
        data: { id: 'settings_123', user_id: userId },
        error: null,
      });

      mockChain.single.mockResolvedValueOnce({
        data: { id: 'settings_123', user_id: userId, show_email: true },
        error: null,
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
      expect(mockSupabase.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          show_email: true,
        })
      );
      expect(mockSupabase.from().update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          invalid_field: expect.anything(),
          user_id: expect.anything(),
          id: expect.anything(),
        })
      );
    });

    it('should return 400 for invalid boolean values', async () => {
      const userId = 'user_123';
      const invalidData = {
        show_email: 'not a boolean',
        show_phone: 123,
      };

      mockAuth.mockReturnValue({ userId } as any);

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