/**
 * Consent Management Tests
 * Tests for COPPA parental consent and general consent tracking
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/privacy/consent/route';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/config/supabase';
import { ConsentType } from '@/lib/privacy/types';

jest.mock('@clerk/nextjs/server');
jest.mock('@/config/supabase');
jest.mock('@/lib/privacy/audit');

describe('Consent Management API', () => {
  const mockAuth = auth as jest.MockedFunction<typeof auth>;
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
  
  const mockSupabase = {
    from: jest.fn(() => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
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

      mockAuth.mockReturnValue({ userId } as any);
      const mockChain = mockSupabase.from();
      mockChain.single.mockResolvedValueOnce({
        data: createdConsent,
        error: null,
      });

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

      mockAuth.mockReturnValue({ userId } as any);

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

      mockAuth.mockReturnValue({ userId } as any);

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

      mockAuth.mockReturnValue({ userId } as any);
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'consent_123', ...consentData },
        error: null,
      });
      mockSupabase.from().update().eq.mockResolvedValue({
        data: null,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/privacy/consent', {
        method: 'POST',
        body: JSON.stringify(consentData),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockSupabase.from).toHaveBeenCalledWith('privacy_settings');
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        directory_visible: false,
      });
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

      mockAuth.mockReturnValue({ userId } as any);
      const mockChain = mockSupabase.from();
      mockChain.data = consentRecords;
      mockChain.error = null;

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
      mockAuth.mockReturnValue({ userId } as any);

      const mockChain = mockSupabase.from();
      mockChain.data = [];
      mockChain.error = null;

      const request = new NextRequest('http://localhost:3000/api/privacy/consent?type=terms_of_service');
      await GET(request);

      expect(mockChain.eq).toHaveBeenCalledWith('consent_type', 'terms_of_service');
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