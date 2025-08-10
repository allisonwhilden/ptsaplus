/**
 * Consent Management Tests
 * Tests for COPPA parental consent and general consent tracking
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/privacy/consent/route';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/config/supabase';
import { ConsentType } from '@/lib/privacy/types';

jest.mock('@/lib/privacy/audit');

describe('Consent Management API', () => {
  const mockAuth = auth as jest.MockedFunction<typeof auth>;
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/privacy/consent', () => {
    it('should record valid consent', async () => {
      const userId = 'user_123';
      const consentData = {
        consentType: 'terms_of_service' as ConsentType,
        granted: true,
        consentVersion: '1.0',
      };

      const createdConsent = {
        id: 'consent_123',
        user_id: userId,
        ...consentData,
        created_at: new Date().toISOString(),
      };

      mockAuth.mockResolvedValue({ userId } as any);
      
      const mockFrom = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: createdConsent, error: null })
      }));
      
      mockCreateClient.mockReturnValue({
        from: mockFrom
      } as any);

      const request = new NextRequest('http://localhost:3000/api/privacy/consent', {
        method: 'POST',
        body: JSON.stringify(consentData),
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'Mozilla/5.0',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.consent).toEqual(createdConsent);
    });

    it('should require parent user ID for COPPA consent', async () => {
      const userId = 'child_123';
      const consentData = {
        consentType: 'coppa_parental' as ConsentType,
        granted: true,
        // Missing parentUserId
      };

      mockAuth.mockResolvedValue({ userId } as any);

      const request = new NextRequest('http://localhost:3000/api/privacy/consent', {
        method: 'POST',
        body: JSON.stringify(consentData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Parent user ID required for COPPA consent');
    });

    it('should validate consent type', async () => {
      const userId = 'user_123';
      const invalidConsent = {
        consentType: 'invalid_type',
        granted: true,
      };

      mockAuth.mockResolvedValue({ userId } as any);

      const request = new NextRequest('http://localhost:3000/api/privacy/consent', {
        method: 'POST',
        body: JSON.stringify(invalidConsent),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid consent type');
    });

    it('should update privacy settings when directory consent is revoked', async () => {
      const userId = 'user_123';
      const consentData = {
        consentType: 'directory_inclusion' as ConsentType,
        granted: false,
      };

      mockAuth.mockResolvedValue({ userId } as any);
      
      // We need to mock two different from() calls
      let fromCallCount = 0;
      const mockFrom = jest.fn((tableName: string) => {
        fromCallCount++;
        const updateMock = jest.fn().mockReturnThis();
        const chain: any = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          update: updateMock,
          single: jest.fn().mockReturnThis(),
          then: (resolve: any) => {
            if (fromCallCount === 1) {
              // First call - consent creation
              resolve({ 
                data: { id: 'consent_123', ...consentData, user_id: userId },
                error: null 
              });
            } else {
              // Second call - privacy settings update
              resolve({ data: null, error: null });
            }
          }
        };
        // Store for assertion
        if (tableName === 'privacy_settings') {
          chain._updateMock = updateMock;
          chain._tableName = tableName;
        }
        return chain;
      });

      mockCreateClient.mockReturnValue({
        from: mockFrom
      } as any);

      const request = new NextRequest('http://localhost:3000/api/privacy/consent', {
        method: 'POST',
        body: JSON.stringify(consentData),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockFrom).toHaveBeenCalledWith('consent_records');
      expect(mockFrom).toHaveBeenCalledWith('privacy_settings');
    });
  });

  describe('GET /api/privacy/consent', () => {
    it('should return user consent records', async () => {
      const userId = 'user_123';
      const consentRecords = [
        {
          id: 'consent_1',
          user_id: userId,
          consent_type: 'terms_of_service',
          granted: true,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'consent_2',
          user_id: userId,
          consent_type: 'privacy_policy',
          granted: true,
          created_at: '2024-01-01T00:01:00Z',
        },
      ];

      mockAuth.mockResolvedValue({ userId } as any);
      
      const mockFrom = jest.fn(() => {
        const eqMock = jest.fn().mockReturnThis();
        return {
          select: jest.fn().mockReturnThis(),
          eq: eqMock,
          order: jest.fn().mockReturnThis(),
          then: (resolve: any) => resolve({ data: consentRecords, error: null }),
          _eqMock: eqMock
        };
      });
      
      mockCreateClient.mockReturnValue({
        from: mockFrom
      } as any);

      const request = new NextRequest('http://localhost:3000/api/privacy/consent');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.records).toEqual(consentRecords);
      expect(data.current).toHaveProperty('terms_of_service');
      expect(data.current).toHaveProperty('privacy_policy');
    });

    it('should filter by consent type when specified', async () => {
      const userId = 'user_123';
      mockAuth.mockResolvedValue({ userId } as any);

      const eqMock = jest.fn().mockReturnThis();
      const mockFrom = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: eqMock,
        order: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: [], error: null })
      }));
      
      mockCreateClient.mockReturnValue({
        from: mockFrom
      } as any);

      const request = new NextRequest('http://localhost:3000/api/privacy/consent?type=terms_of_service');
      await GET(request);

      expect(eqMock).toHaveBeenCalledWith('consent_type', 'terms_of_service');
    });
  });

  describe('COPPA Compliance', () => {
    it('should correctly identify users under 13', () => {
      const { isUnderCOPPAAge } = require('@/lib/privacy/types');
      
      const today = new Date();
      
      // Test 12 year old
      const twelveYearsAgo = new Date();
      twelveYearsAgo.setFullYear(today.getFullYear() - 12);
      expect(isUnderCOPPAAge(twelveYearsAgo)).toBe(true);
      
      // Test 13 year old
      const thirteenYearsAgo = new Date();
      thirteenYearsAgo.setFullYear(today.getFullYear() - 13);
      thirteenYearsAgo.setDate(today.getDate() - 1);
      expect(isUnderCOPPAAge(thirteenYearsAgo)).toBe(false);
      
      // Test exactly 13 years ago
      const exactlyThirteen = new Date();
      exactlyThirteen.setFullYear(today.getFullYear() - 13);
      expect(isUnderCOPPAAge(exactlyThirteen)).toBe(false);
    });

    it('should require parental consent for child accounts', () => {
      const { getRequiredConsents } = require('@/lib/privacy/types');
      
      const childConsents = getRequiredConsents(true, []);
      expect(childConsents).toContain('coppa_parental');
      expect(childConsents).toContain('terms_of_service');
      expect(childConsents).toContain('privacy_policy');
      
      const adultConsents = getRequiredConsents(false, []);
      expect(adultConsents).not.toContain('coppa_parental');
      expect(adultConsents).toContain('terms_of_service');
      expect(adultConsents).toContain('privacy_policy');
    });

    it('should include AI consent when AI features are used', () => {
      const { getRequiredConsents } = require('@/lib/privacy/types');
      
      const consentsWithAI = getRequiredConsents(false, ['ai']);
      expect(consentsWithAI).toContain('ai_features');
      
      const consentsWithoutAI = getRequiredConsents(false, []);
      expect(consentsWithoutAI).not.toContain('ai_features');
    });
  });
});