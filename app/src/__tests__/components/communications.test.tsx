import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import EmailComposePage from '@/app/communications/email/compose/page'
import AnnouncementNewPage from '@/app/communications/announcements/new/page'
import '@testing-library/jest-dom'

// Mock dependencies
jest.mock('@clerk/nextjs')
jest.mock('next/navigation')
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

// Mock fetch
global.fetch = jest.fn()

describe('Communication Components', () => {
  const mockPush = jest.fn()
  const mockUser = {
    id: 'user123',
    emailAddresses: [{ emailAddress: 'admin@example.com' }],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useUser as jest.Mock).mockReturnValue({ user: mockUser })
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    
    // Mock fetch for API calls
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/members/counts')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            all: 150,
            board: 8,
            committee_chairs: 12,
            teachers: 25,
          }),
        })
      }
      return Promise.resolve({
        ok: false,
        json: async () => ({ error: 'Not found' }),
      })
    })
  })

  describe('EmailComposePage', () => {
    it('should render email composer form', async () => {
      await act(async () => {
        render(<EmailComposePage />)
      })

      expect(screen.getByText(/Select Email Template/i)).toBeInTheDocument()
      expect(screen.getByText(/Select Recipients/i)).toBeInTheDocument()
      expect(screen.getByText(/Email Details/i)).toBeInTheDocument()
    })

    it('should have template selector', async () => {
      await act(async () => {
        render(<EmailComposePage />)
      })

      // Just verify the template selector exists
      expect(screen.getByText('Template *')).toBeInTheDocument()
      expect(screen.getByText('Select a template')).toBeInTheDocument()
    })

    it('should have audience selector', async () => {
      await act(async () => {
        render(<EmailComposePage />)
      })

      // Just verify the audience selector exists
      expect(screen.getByText('Audience *')).toBeInTheDocument()
      expect(screen.getByText('All Members')).toBeInTheDocument() // Default selection
    })

    it('should have subject line input', async () => {
      await act(async () => {
        render(<EmailComposePage />)
      })

      const subjectInput = screen.getByPlaceholderText(/Enter email subject/i) as HTMLInputElement
      expect(subjectInput).toBeInTheDocument()
      expect(subjectInput.value).toBe('') // Should start empty
    })

    it('should have preview button', async () => {
      await act(async () => {
        render(<EmailComposePage />)
      })

      const previewButton = screen.getByText(/Show Preview/i)
      expect(previewButton).toBeInTheDocument()
    })

    it('should have send email button', async () => {
      await act(async () => {
        render(<EmailComposePage />)
      })

      const sendButton = screen.getByText(/Send Email/i)
      expect(sendButton).toBeInTheDocument()
    })
  })

  describe('AnnouncementNewPage', () => {
    it('should render announcement creation form', async () => {
      await act(async () => {
        render(<AnnouncementNewPage />)
      })

      expect(screen.getByText(/Announcement Details/i)).toBeInTheDocument()
      expect(screen.getByText(/Publishing Options/i)).toBeInTheDocument()
    })

    it('should have required field indicators', async () => {
      await act(async () => {
        render(<AnnouncementNewPage />)
      })

      expect(screen.getByLabelText(/Title \*/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Content \*/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Type \*/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Audience \*/i)).toBeInTheDocument()
    })

    it('should have announcement type selector', async () => {
      await act(async () => {
        render(<AnnouncementNewPage />)
      })

      expect(screen.getByLabelText(/Type \*/i)).toBeInTheDocument()
    })

    it('should have pin and email notification toggles', async () => {
      await act(async () => {
        render(<AnnouncementNewPage />)
      })

      expect(screen.getByLabelText(/Pin to Top/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Send Email Notification/i)).toBeInTheDocument()
    })

    it('should have preview button', async () => {
      await act(async () => {
        render(<AnnouncementNewPage />)
      })

      const previewButton = screen.getByText(/Show Preview/i)
      expect(previewButton).toBeInTheDocument()
    })

    it('should have publish button', async () => {
      await act(async () => {
        render(<AnnouncementNewPage />)
      })

      const publishButton = screen.getByText(/Publish Announcement/i)
      expect(publishButton).toBeInTheDocument()
    })

    it('should have title and content fields', async () => {
      await act(async () => {
        render(<AnnouncementNewPage />)
      })

      const titleInput = screen.getByPlaceholderText(/Enter announcement title/i)
      const contentTextarea = screen.getByPlaceholderText(/Write your announcement content/i)
      
      expect(titleInput).toBeInTheDocument()
      expect(contentTextarea).toBeInTheDocument()
    })
  })

  describe('Integration', () => {
    it('should render email composer without errors', async () => {
      await act(async () => {
        render(<EmailComposePage />)
      })

      // Just verify the component renders
      expect(screen.getByText(/Select Email Template/i)).toBeInTheDocument()
    })

    it('should render announcement creator without errors', async () => {
      await act(async () => {
        render(<AnnouncementNewPage />)
      })

      // Just verify the component renders
      expect(screen.getByText(/Announcement Details/i)).toBeInTheDocument()
    })
  })
})