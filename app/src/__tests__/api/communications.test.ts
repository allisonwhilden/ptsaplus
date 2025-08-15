import { NextRequest } from 'next/server'
import { POST as sendEmail } from '@/app/api/communications/email/send/route'
import { GET as searchMembers } from '@/app/api/members/search/route'
import { GET as getMemberCounts } from '@/app/api/members/counts/route'
import { auth } from '@clerk/nextjs/server'
import { getSupabaseServiceClient } from '@/lib/supabase-server'

// Mock dependencies
jest.mock('@clerk/nextjs/server')
jest.mock('@/lib/supabase-server')
jest.mock('@/lib/email/client')
jest.mock('@/lib/email/render-template')
jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn().mockResolvedValue(null),
  RATE_LIMITS: {
    emails: { windowMs: 60000, maxRequests: 3 },
    readOperations: { windowMs: 60000, maxRequests: 60 },
  },
}))

describe('Communication API Endpoints', () => {
  const mockAuth = auth as jest.MockedFunction<typeof auth>
  const mockSupabase = {
    from: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getSupabaseServiceClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  describe('POST /api/communications/email/send', () => {
    it('should require authentication', async () => {
      mockAuth.mockResolvedValue({ userId: null } as any)

      const request = new NextRequest('http://localhost:3000/api/communications/email/send', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await sendEmail(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should require admin or board role', async () => {
      mockAuth.mockResolvedValue({ userId: 'user123' } as any)
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'member' },
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/communications/email/send', {
        method: 'POST',
        body: JSON.stringify({
          template: 'welcome',
          audience: 'all',
          subject: 'Test Email',
        }),
      })

      const response = await sendEmail(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Unauthorized to send emails')
    })

    it('should validate required fields', async () => {
      mockAuth.mockResolvedValue({ userId: 'admin123' } as any)
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/communications/email/send', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
          audience: 'all',
        }),
      })

      const response = await sendEmail(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
    })
  })

  describe('GET /api/members/search', () => {
    it('should require authentication', async () => {
      mockAuth.mockResolvedValue({ userId: null } as any)

      const request = new NextRequest('http://localhost:3000/api/members/search?q=john')

      const response = await searchMembers(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should require admin or board role', async () => {
      mockAuth.mockResolvedValue({ userId: 'user123' } as any)
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'member' },
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/members/search?q=john')

      const response = await searchMembers(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Unauthorized to search members')
    })

    it('should require minimum query length', async () => {
      mockAuth.mockResolvedValue({ userId: 'admin123' } as any)
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
            }),
          }),
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/members/search?q=j')

      const response = await searchMembers(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Search query must be at least 2 characters')
    })

    it('should return search results for valid queries', async () => {
      mockAuth.mockResolvedValue({ userId: 'admin123' } as any)
      
      // Mock role check
      const selectMock = jest.fn()
      selectMock
        .mockReturnValueOnce({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
            }),
          }),
        })
        .mockReturnValueOnce({
          or: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [
                  { id: '1', first_name: 'John', last_name: 'Doe', email: 'john@example.com', role: 'member' },
                  { id: '2', first_name: 'Jane', last_name: 'Johnson', email: 'jane@example.com', role: 'board' },
                ],
                error: null,
              }),
            }),
          }),
        })

      mockSupabase.from.mockReturnValue({
        select: selectMock,
      })

      const request = new NextRequest('http://localhost:3000/api/members/search?q=john')

      const response = await searchMembers(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.members).toHaveLength(2)
      expect(data.members[0]).toHaveProperty('name')
      expect(data.members[0]).toHaveProperty('email')
    })
  })

  describe('GET /api/members/counts', () => {
    it('should require authentication', async () => {
      mockAuth.mockResolvedValue({ userId: null } as any)

      const request = new NextRequest('http://localhost:3000/api/members/counts')

      const response = await getMemberCounts(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return member counts by role', async () => {
      mockAuth.mockResolvedValue({ userId: 'user123' } as any)
      
      const countMock = jest.fn()
      countMock
        .mockResolvedValueOnce({ count: 150 }) // all members
        .mockResolvedValueOnce({ count: 8 })   // board
        .mockResolvedValueOnce({ count: 12 })  // committee chairs
        .mockResolvedValueOnce({ count: 25 })  // teachers

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(countMock()),
      })

      const request = new NextRequest('http://localhost:3000/api/members/counts')

      const response = await getMemberCounts(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        all: 150,
        board: 8,
        committee_chairs: 12,
        teachers: 25,
      })
    })
  })
})