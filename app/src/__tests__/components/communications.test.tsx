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

    it('should show all email templates', async () => {
      await act(async () => {
        render(<EmailComposePage />)
      })

      const templateSelect = screen.getByRole('combobox')
      fireEvent.click(templateSelect)

      // Wait for dropdown to open
      await waitFor(() => {
        expect(screen.getByText('Welcome Email')).toBeInTheDocument()
        expect(screen.getByText('Payment Confirmation')).toBeInTheDocument()
        expect(screen.getByText('Event Reminder')).toBeInTheDocument()
        expect(screen.getByText('General Announcement')).toBeInTheDocument()
        expect(screen.getByText('Volunteer Reminder')).toBeInTheDocument()
        expect(screen.getByText('Meeting Minutes')).toBeInTheDocument()
      })
    })

    it('should show audience options', async () => {
      await act(async () => {
        render(<EmailComposePage />)
      })

      // Get all selects - second one is audience
      const selects = screen.getAllByRole('combobox')
      fireEvent.click(selects[1])

      await waitFor(() => {
        expect(screen.getByText('All Members')).toBeInTheDocument()
        expect(screen.getByText('Board Only')).toBeInTheDocument()
        expect(screen.getByText('Committee Chairs')).toBeInTheDocument()
        expect(screen.getByText('Teachers')).toBeInTheDocument()
        expect(screen.getByText('Custom Selection')).toBeInTheDocument()
      })
    })

    it('should update subject line based on template selection', async () => {
      await act(async () => {
        render(<EmailComposePage />)
      })

      const selects = screen.getAllByRole('combobox')
      fireEvent.click(selects[0])
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Welcome Email'))
      })

      await waitFor(() => {
        const subjectInput = screen.getByPlaceholderText(/Enter email subject/i) as HTMLInputElement
        expect(subjectInput.value).toBe('Welcome to Our PTSA!')
      })
    })

    it('should show preview when preview button is clicked', async () => {
      await act(async () => {
        render(<EmailComposePage />)
      })

      const previewButton = screen.getByText(/Show Preview/i)
      fireEvent.click(previewButton)

      expect(screen.getByText(/Email Preview/i)).toBeInTheDocument()
      expect(screen.getByText(/Hide Preview/i)).toBeInTheDocument()
    })

    it('should validate required fields', async () => {
      await act(async () => {
        render(<EmailComposePage />)
      })

      const sendButton = screen.getByText(/Send Email/i)
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(screen.getByText(/Please select a template/i)).toBeInTheDocument()
      })
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

    it('should show announcement types', async () => {
      await act(async () => {
        render(<AnnouncementNewPage />)
      })

      const selects = screen.getAllByRole('combobox')
      // Find the type select - should be first one
      fireEvent.click(selects[0])

      await waitFor(() => {
        expect(screen.getByText('General')).toBeInTheDocument()
        expect(screen.getByText('Urgent')).toBeInTheDocument()
        expect(screen.getByText('Event')).toBeInTheDocument()
      })
    })

    it('should have pin and email notification toggles', async () => {
      await act(async () => {
        render(<AnnouncementNewPage />)
      })

      expect(screen.getByLabelText(/Pin to Top/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Send Email Notification/i)).toBeInTheDocument()
    })

    it('should show preview when preview button is clicked', async () => {
      await act(async () => {
        render(<AnnouncementNewPage />)
      })

      // Fill in some data
      const titleInput = screen.getByPlaceholderText(/Enter announcement title/i)
      fireEvent.change(titleInput, { target: { value: 'Test Announcement' } })

      const contentTextarea = screen.getByPlaceholderText(/Write your announcement content/i)
      fireEvent.change(contentTextarea, { target: { value: 'This is test content' } })

      const previewButton = screen.getByText(/Show Preview/i)
      fireEvent.click(previewButton)

      expect(screen.getByText(/Announcement Preview/i)).toBeInTheDocument()
      expect(screen.getByText('Test Announcement')).toBeInTheDocument()
      expect(screen.getByText('This is test content')).toBeInTheDocument()
    })

    it('should validate required fields', async () => {
      await act(async () => {
        render(<AnnouncementNewPage />)
      })

      const publishButton = screen.getByText(/Publish Announcement/i)
      fireEvent.click(publishButton)

      await waitFor(() => {
        expect(screen.getByText(/Title is required/i)).toBeInTheDocument()
        expect(screen.getByText(/Content is required/i)).toBeInTheDocument()
      })
    })

    it('should show auto-save indicator', async () => {
      await act(async () => {
        render(<AnnouncementNewPage />)
      })

      const titleInput = screen.getByPlaceholderText(/Enter announcement title/i)
      fireEvent.change(titleInput, { target: { value: 'Test' } })

      await waitFor(() => {
        expect(screen.getByText(/Draft auto-saved/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('Integration', () => {
    it('should handle successful email send', async () => {
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
        if (url.includes('/api/communications/email/send')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, queuedCount: 10 }),
          })
        }
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: 'Not found' }),
        })
      })

      await act(async () => {
        render(<EmailComposePage />)
      })

      // Fill form - use getAllByRole to handle multiple selects
      const selects = screen.getAllByRole('combobox')
      
      // First select is template
      fireEvent.click(selects[0])
      await waitFor(() => {
        fireEvent.click(screen.getByText('Welcome Email'))
      })

      // Second select is audience
      fireEvent.click(selects[1])
      await waitFor(() => {
        fireEvent.click(screen.getByText('All Members'))
      })

      const sendButton = screen.getByText(/Send Email/i)
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/communications/email/history')
      })
    })

    it('should handle successful announcement creation', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ announcement: { id: '123' } }),
      })

      await act(async () => {
        render(<AnnouncementNewPage />)
      })

      // Fill form
      const titleInput = screen.getByPlaceholderText(/Enter announcement title/i)
      fireEvent.change(titleInput, { target: { value: 'Test Announcement' } })

      const contentTextarea = screen.getByPlaceholderText(/Write your announcement content/i)
      fireEvent.change(contentTextarea, { target: { value: 'This is test content' } })

      const publishButton = screen.getByText(/Publish Announcement/i)
      fireEvent.click(publishButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/communications/announcements')
      })
    })
  })
})