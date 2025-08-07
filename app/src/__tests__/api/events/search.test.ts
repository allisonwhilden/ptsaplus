/**
 * Tests for event search functionality with SQL injection protection
 */

import { GET } from '@/app/api/events/route';
import { NextRequest } from 'next/server';
import { createMockAuth } from '@/__tests__/utils/auth-mocks';

// Mock dependencies
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/supabase-server', () => ({
  createClient: jest.fn(),
}));

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase-server';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('Event Search with SQL Injection Protection', () => {
  let mockSupabase: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };
    
    // Final query returns events
    mockSupabase.range.mockResolvedValue({
      data: [
        {
          id: 'event-1',
          title: 'Test Event',
          description: 'Test Description',
          start_time: '2024-12-01T10:00:00Z',
          visibility: 'public',
        },
      ],
      error: null,
      count: 1,
    });
    
    // Mock the promise resolution properly
    // @ts-expect-error - Mock typing
    mockCreateClient.mockImplementation(async () => mockSupabase);
  });
  
  describe('Search with special characters', () => {
    it('should handle search with percent wildcard character', async () => {
      mockAuth.mockResolvedValue(createMockAuth(null));
      
      const request = new NextRequest('http://localhost:3000/api/events?search=10%25%20discount');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      expect(mockSupabase.or).toHaveBeenCalledWith(
        expect.stringContaining('10\\%')
      );
    });
    
    it('should handle search with underscore character', async () => {
      mockAuth.mockResolvedValue(createMockAuth(null));
      
      const request = new NextRequest('http://localhost:3000/api/events?search=user_name');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      expect(mockSupabase.or).toHaveBeenCalledWith(
        expect.stringContaining('user\\_name')
      );
    });
    
    it('should handle search with backslash character', async () => {
      mockAuth.mockResolvedValue(createMockAuth(null));
      
      const request = new NextRequest('http://localhost:3000/api/events?search=path\\to\\file');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      expect(mockSupabase.or).toHaveBeenCalledWith(
        expect.stringContaining('path\\\\to\\\\file')
      );
    });
    
    it('should handle search with mixed special characters', async () => {
      mockAuth.mockResolvedValue(createMockAuth(null));
      
      const request = new NextRequest('http://localhost:3000/api/events?search=test%_\\value');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      expect(mockSupabase.or).toHaveBeenCalledWith(
        expect.stringContaining('test\\%\\_\\\\value')
      );
    });
    
    it('should handle normal search terms without modification', async () => {
      mockAuth.mockResolvedValue(createMockAuth(null));
      
      const request = new NextRequest('http://localhost:3000/api/events?search=Annual%20Meeting');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      expect(mockSupabase.or).toHaveBeenCalledWith(
        expect.stringContaining('Annual Meeting')
      );
    });
    
    it('should protect against SQL injection attempts', async () => {
      mockAuth.mockResolvedValue(createMockAuth(null));
      
      // Attempt SQL injection with LIKE wildcards
      const request = new NextRequest("http://localhost:3000/api/events?search=%';DROP TABLE events;--");
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      // The percent sign should be escaped
      expect(mockSupabase.or).toHaveBeenCalledWith(
        expect.stringContaining("\\%';DROP TABLE events;--")
      );
    });
    
    it('should handle empty search parameter', async () => {
      mockAuth.mockResolvedValue(createMockAuth(null));
      
      const request = new NextRequest('http://localhost:3000/api/events?search=');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      // Empty search should not call or() method
      expect(mockSupabase.or).not.toHaveBeenCalled();
    });
  });
  
  describe('Search functionality', () => {
    it('should search in both title and description fields', async () => {
      mockAuth.mockResolvedValue(createMockAuth(null));
      
      const request = new NextRequest('http://localhost:3000/api/events?search=meeting');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      expect(mockSupabase.or).toHaveBeenCalledWith(
        'title.ilike.%meeting%,description.ilike.%meeting%'
      );
    });
    
    it('should combine search with other filters', async () => {
      mockAuth.mockResolvedValue(createMockAuth('user-123'));
      
      // Mock member lookup
      mockSupabase.single.mockResolvedValue({
        data: { role: 'member' },
        error: null,
      });
      
      const request = new NextRequest('http://localhost:3000/api/events?search=fundraiser&type=fundraiser&visibility=public');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      expect(mockSupabase.eq).toHaveBeenCalledWith('type', 'fundraiser');
      expect(mockSupabase.eq).toHaveBeenCalledWith('visibility', 'public');
      expect(mockSupabase.or).toHaveBeenCalledWith(
        'title.ilike.%fundraiser%,description.ilike.%fundraiser%'
      );
    });
  });
});