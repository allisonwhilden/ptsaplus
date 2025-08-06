/**
 * RSVPButton Component Tests
 * 
 * Tests for the RSVP button component including:
 * - Authentication states
 * - RSVP form interactions
 * - Guest count handling
 * - Capacity limits
 * - Error handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { RSVPButton } from '@/components/events/RSVPButton';
import { EventWithCounts } from '@/lib/events/types';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('@/hooks/use-toast');

const mockRouter = {
  push: jest.fn(),
  refresh: jest.fn(),
};

const mockToast = jest.fn();

(useRouter as jest.Mock).mockReturnValue(mockRouter);
(useToast as jest.Mock).mockReturnValue({ toast: mockToast });

// Mock fetch globally
global.fetch = jest.fn();

describe('RSVPButton', () => {
  const baseEvent: EventWithCounts = {
    id: 'event-123',
    organization_id: '00000000-0000-0000-0000-000000000000',
    title: 'PTA Meeting',
    description: 'Monthly PTA meeting',
    type: 'meeting',
    start_time: '2025-08-20T19:00:00Z',
    end_time: '2025-08-20T21:00:00Z',
    location_type: 'in_person',
    location_details: { address: '123 School St' },
    capacity: 50,
    requires_rsvp: true,
    allow_guests: true,
    visibility: 'members',
    created_by: 'creator-123',
    created_at: '2025-08-01T10:00:00Z',
    updated_at: '2025-08-01T10:00:00Z',
    rsvp_count: 20,
    attending_count: 18,
    available_spots: 32,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Authentication States', () => {
    it('should show sign in button for unauthenticated users', () => {
      render(<RSVPButton event={baseEvent} userId={undefined} />);

      const signInButton = screen.getByRole('button', { name: /sign in to rsvp/i });
      expect(signInButton).toBeInTheDocument();
    });

    it('should redirect to sign in page when clicked by unauthenticated user', async () => {
      const user = userEvent.setup();
      render(<RSVPButton event={baseEvent} userId={undefined} />);

      const signInButton = screen.getByRole('button', { name: /sign in to rsvp/i });
      await user.click(signInButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/sign-in?redirect_url=/events/event-123');
    });

    it('should disable sign in button for past events', () => {
      const pastEvent = {
        ...baseEvent,
        start_time: '2025-07-01T19:00:00Z', // Past date
      };

      render(<RSVPButton event={pastEvent} userId={undefined} />);

      const signInButton = screen.getByRole('button', { name: /sign in to rsvp/i });
      expect(signInButton).toBeDisabled();
    });
  });

  describe('Event States', () => {
    it('should not render for past events when authenticated', () => {
      const pastEvent = {
        ...baseEvent,
        start_time: '2025-07-01T19:00:00Z', // Past date
      };

      const { container } = render(<RSVPButton event={pastEvent} userId="user-123" />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render for events that do not require RSVP', () => {
      const noRSVPEvent = {
        ...baseEvent,
        requires_rsvp: false,
      };

      const { container } = render(<RSVPButton event={noRSVPEvent} userId="user-123" />);
      expect(container.firstChild).toBeNull();
    });

    it('should show "Event Full" button for full events', () => {
      const fullEvent = {
        ...baseEvent,
        capacity: 20,
        attending_count: 20,
        available_spots: 0,
      };

      render(<RSVPButton event={fullEvent} userId="user-123" />);

      const fullButton = screen.getByRole('button', { name: /event full/i });
      expect(fullButton).toBeInTheDocument();
      expect(fullButton).toBeDisabled();
    });

    it('should show RSVP button for available events', () => {
      render(<RSVPButton event={baseEvent} userId="user-123" />);

      const rsvpButton = screen.getByRole('button', { name: /^rsvp$/i });
      expect(rsvpButton).toBeInTheDocument();
      expect(rsvpButton).not.toBeDisabled();
    });
  });

  describe('Existing RSVP States', () => {
    it('should show "Attending" status for attending users', () => {
      const eventWithRSVP = {
        ...baseEvent,
        user_rsvp: {
          id: 'rsvp-123',
          event_id: 'event-123',
          user_id: 'user-123',
          status: 'attending' as const,
          guest_count: 2,
          notes: 'Looking forward to it',
          created_at: '2025-08-01T10:00:00Z',
          updated_at: '2025-08-01T10:00:00Z',
        },
      };

      render(<RSVPButton event={eventWithRSVP} userId="user-123" />);

      const attendingButton = screen.getByRole('button', { name: /attending/i });
      expect(attendingButton).toBeInTheDocument();
    });

    it('should show "Not Attending" status for declining users', () => {
      const eventWithRSVP = {
        ...baseEvent,
        user_rsvp: {
          id: 'rsvp-123',
          event_id: 'event-123',
          user_id: 'user-123',
          status: 'not_attending' as const,
          guest_count: 0,
          notes: 'Sorry, cannot make it',
          created_at: '2025-08-01T10:00:00Z',
          updated_at: '2025-08-01T10:00:00Z',
        },
      };

      render(<RSVPButton event={eventWithRSVP} userId="user-123" />);

      const notAttendingButton = screen.getByRole('button', { name: /not attending/i });
      expect(notAttendingButton).toBeInTheDocument();
    });

    it('should show "Maybe" status for maybe users', () => {
      const eventWithRSVP = {
        ...baseEvent,
        user_rsvp: {
          id: 'rsvp-123',
          event_id: 'event-123',
          user_id: 'user-123',
          status: 'maybe' as const,
          guest_count: 0,
          notes: 'Will try to make it',
          created_at: '2025-08-01T10:00:00Z',
          updated_at: '2025-08-01T10:00:00Z',
        },
      };

      render(<RSVPButton event={eventWithRSVP} userId="user-123" />);

      const maybeButton = screen.getByRole('button', { name: /maybe/i });
      expect(maybeButton).toBeInTheDocument();
    });
  });

  describe('RSVP Form Interactions', () => {
    it('should open RSVP dialog when button is clicked', async () => {
      const user = userEvent.setup();
      render(<RSVPButton event={baseEvent} userId="user-123" />);

      const rsvpButton = screen.getByRole('button', { name: /^rsvp$/i });
      await user.click(rsvpButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(`RSVP for ${baseEvent.title}`)).toBeInTheDocument();
    });

    it('should show radio buttons for RSVP status', async () => {
      const user = userEvent.setup();
      render(<RSVPButton event={baseEvent} userId="user-123" />);

      const rsvpButton = screen.getByRole('button', { name: /^rsvp$/i });
      await user.click(rsvpButton);

      expect(screen.getByRole('radio', { name: /yes, i'll be there/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /no, i can't make it/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /maybe/i })).toBeInTheDocument();
    });

    it('should show guest count input when attending and guests allowed', async () => {
      const user = userEvent.setup();
      render(<RSVPButton event={baseEvent} userId="user-123" />);

      const rsvpButton = screen.getByRole('button', { name: /^rsvp$/i });
      await user.click(rsvpButton);

      // Select attending
      const attendingRadio = screen.getByRole('radio', { name: /yes, i'll be there/i });
      await user.click(attendingRadio);

      expect(screen.getByLabelText(/number of guests/i)).toBeInTheDocument();
      expect(screen.getByText(/you can bring up to 10 guests/i)).toBeInTheDocument();
    });

    it('should hide guest count input when not attending', async () => {
      const user = userEvent.setup();
      render(<RSVPButton event={baseEvent} userId="user-123" />);

      const rsvpButton = screen.getByRole('button', { name: /^rsvp$/i });
      await user.click(rsvpButton);

      // Select not attending
      const notAttendingRadio = screen.getByRole('radio', { name: /no, i can't make it/i });
      await user.click(notAttendingRadio);

      expect(screen.queryByLabelText(/number of guests/i)).not.toBeInTheDocument();
    });

    it('should hide guest count input when guests not allowed', async () => {
      const noGuestEvent = {
        ...baseEvent,
        allow_guests: false,
      };

      const user = userEvent.setup();
      render(<RSVPButton event={noGuestEvent} userId="user-123" />);

      const rsvpButton = screen.getByRole('button', { name: /^rsvp$/i });
      await user.click(rsvpButton);

      // Select attending
      const attendingRadio = screen.getByRole('radio', { name: /yes, i'll be there/i });
      await user.click(attendingRadio);

      expect(screen.queryByLabelText(/number of guests/i)).not.toBeInTheDocument();
    });

    it('should allow entering notes', async () => {
      const user = userEvent.setup();
      render(<RSVPButton event={baseEvent} userId="user-123" />);

      const rsvpButton = screen.getByRole('button', { name: /^rsvp$/i });
      await user.click(rsvpButton);

      const notesTextarea = screen.getByLabelText(/notes \(optional\)/i);
      await user.type(notesTextarea, 'Looking forward to this event!');

      expect(notesTextarea).toHaveValue('Looking forward to this event!');
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'rsvp-123',
          status: 'attending',
          guest_count: 2,
        }),
      });
    });

    it('should submit RSVP successfully', async () => {
      const user = userEvent.setup();
      const onUpdate = jest.fn();
      render(<RSVPButton event={baseEvent} userId="user-123" onUpdate={onUpdate} />);

      const rsvpButton = screen.getByRole('button', { name: /^rsvp$/i });
      await user.click(rsvpButton);

      // Fill out form
      const attendingRadio = screen.getByRole('radio', { name: /yes, i'll be there/i });
      await user.click(attendingRadio);

      const guestInput = screen.getByLabelText(/number of guests/i);
      await user.clear(guestInput);
      await user.type(guestInput, '2');

      const notesTextarea = screen.getByLabelText(/notes \(optional\)/i);
      await user.type(notesTextarea, 'Excited to attend!');

      // Submit
      const saveButton = screen.getByRole('button', { name: /save rsvp/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/events/event-123/rsvp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'attending',
            guest_count: 2,
            notes: 'Excited to attend!',
          }),
        });
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'RSVP updated',
        description: "You're attending PTA Meeting with 2 guests",
      });

      expect(onUpdate).toHaveBeenCalled();
    });

    it('should set guest count to 0 when not attending', async () => {
      const user = userEvent.setup();
      render(<RSVPButton event={baseEvent} userId="user-123" />);

      const rsvpButton = screen.getByRole('button', { name: /^rsvp$/i });
      await user.click(rsvpButton);

      // Select not attending
      const notAttendingRadio = screen.getByRole('radio', { name: /no, i can't make it/i });
      await user.click(notAttendingRadio);

      // Submit
      const saveButton = screen.getByRole('button', { name: /save rsvp/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/events/event-123/rsvp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'not_attending',
            guest_count: 0,
            notes: '',
          }),
        });
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'RSVP updated',
        description: "You've declined PTA Meeting",
      });
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Event is full' }),
      });

      const user = userEvent.setup();
      render(<RSVPButton event={baseEvent} userId="user-123" />);

      const rsvpButton = screen.getByRole('button', { name: /^rsvp$/i });
      await user.click(rsvpButton);

      const saveButton = screen.getByRole('button', { name: /save rsvp/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Event is full',
          variant: 'destructive',
        });
      });

      // Dialog should remain open on error
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should show loading state during submission', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
      );

      const user = userEvent.setup();
      render(<RSVPButton event={baseEvent} userId="user-123" />);

      const rsvpButton = screen.getByRole('button', { name: /^rsvp$/i });
      await user.click(rsvpButton);

      const saveButton = screen.getByRole('button', { name: /save rsvp/i });
      await user.click(saveButton);

      expect(screen.getByRole('button', { name: /saving.../i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /saving.../i })).toBeDisabled();
    });
  });

  describe('Existing RSVP Management', () => {
    const eventWithRSVP = {
      ...baseEvent,
      user_rsvp: {
        id: 'rsvp-123',
        event_id: 'event-123',
        user_id: 'user-123',
        status: 'attending' as const,
        guest_count: 1,
        notes: 'Original notes',
        created_at: '2025-08-01T10:00:00Z',
        updated_at: '2025-08-01T10:00:00Z',
      },
    };

    it('should pre-populate form with existing RSVP data', async () => {
      const user = userEvent.setup();
      render(<RSVPButton event={eventWithRSVP} userId="user-123" />);

      const attendingButton = screen.getByRole('button', { name: /attending/i });
      await user.click(attendingButton);

      // Check pre-populated values
      expect(screen.getByRole('radio', { name: /yes, i'll be there/i })).toBeChecked();
      expect(screen.getByLabelText(/number of guests/i)).toHaveValue(1);
      expect(screen.getByLabelText(/notes \(optional\)/i)).toHaveValue('Original notes');
    });

    it('should show cancel RSVP button for existing RSVPs', async () => {
      const user = userEvent.setup();
      render(<RSVPButton event={eventWithRSVP} userId="user-123" />);

      const attendingButton = screen.getByRole('button', { name: /attending/i });
      await user.click(attendingButton);

      expect(screen.getByRole('button', { name: /cancel rsvp/i })).toBeInTheDocument();
    });

    it('should cancel RSVP successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const user = userEvent.setup();
      const onUpdate = jest.fn();
      render(<RSVPButton event={eventWithRSVP} userId="user-123" onUpdate={onUpdate} />);

      const attendingButton = screen.getByRole('button', { name: /attending/i });
      await user.click(attendingButton);

      const cancelButton = screen.getByRole('button', { name: /cancel rsvp/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/events/event-123/rsvp', {
          method: 'DELETE',
        });
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'RSVP cancelled',
        description: 'Your RSVP has been cancelled',
      });

      expect(onUpdate).toHaveBeenCalled();
    });

    it('should handle cancel RSVP errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
      });

      const user = userEvent.setup();
      render(<RSVPButton event={eventWithRSVP} userId="user-123" />);

      const attendingButton = screen.getByRole('button', { name: /attending/i });
      await user.click(attendingButton);

      const cancelButton = screen.getByRole('button', { name: /cancel rsvp/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to cancel RSVP',
          variant: 'destructive',
        });
      });
    });
  });

  describe('Guest Count Validation', () => {
    it('should limit guest count input to max 10', async () => {
      const user = userEvent.setup();
      render(<RSVPButton event={baseEvent} userId="user-123" />);

      const rsvpButton = screen.getByRole('button', { name: /^rsvp$/i });
      await user.click(rsvpButton);

      const attendingRadio = screen.getByRole('radio', { name: /yes, i'll be there/i });
      await user.click(attendingRadio);

      const guestInput = screen.getByLabelText(/number of guests/i) as HTMLInputElement;
      expect(guestInput.max).toBe('10');
      expect(guestInput.min).toBe('0');
    });

    it('should handle invalid guest count input', async () => {
      const user = userEvent.setup();
      render(<RSVPButton event={baseEvent} userId="user-123" />);

      const rsvpButton = screen.getByRole('button', { name: /^rsvp$/i });
      await user.click(rsvpButton);

      const attendingRadio = screen.getByRole('radio', { name: /yes, i'll be there/i });
      await user.click(attendingRadio);

      const guestInput = screen.getByLabelText(/number of guests/i);
      
      // Test invalid input
      await user.clear(guestInput);
      await user.type(guestInput, 'abc');
      
      expect(guestInput).toHaveValue(0); // Should default to 0 for invalid input
    });

    it('should show different toast messages based on guest count', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'rsvp-123' }),
      });

      const user = userEvent.setup();
      render(<RSVPButton event={baseEvent} userId="user-123" />);

      const rsvpButton = screen.getByRole('button', { name: /^rsvp$/i });
      await user.click(rsvpButton);

      const attendingRadio = screen.getByRole('radio', { name: /yes, i'll be there/i });
      await user.click(attendingRadio);

      // Test with 0 guests
      const saveButton = screen.getByRole('button', { name: /save rsvp/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'RSVP updated',
          description: "You're attending PTA Meeting",
        });
      });

      // Reset and test with 1 guest
      mockToast.mockClear();
      await user.click(rsvpButton);
      
      const guestInput = screen.getByLabelText(/number of guests/i);
      await user.clear(guestInput);
      await user.type(guestInput, '1');
      
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'RSVP updated',
          description: "You're attending PTA Meeting with 1 guest",
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      const user = userEvent.setup();
      render(<RSVPButton event={baseEvent} userId="user-123" />);

      const rsvpButton = screen.getByRole('button', { name: /^rsvp$/i });
      await user.click(rsvpButton);

      // Check dialog accessibility
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Check form elements have proper labels
      expect(screen.getByLabelText(/will you attend/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes \(optional\)/i)).toBeInTheDocument();

      // Check radio buttons are properly labeled
      const radioButtons = screen.getAllByRole('radio');
      radioButtons.forEach(radio => {
        expect(radio).toHaveAccessibleName();
      });
    });

    it('should handle keyboard navigation', async () => {
      render(<RSVPButton event={baseEvent} userId="user-123" />);

      const rsvpButton = screen.getByRole('button', { name: /^rsvp$/i });
      
      // Should be focusable
      rsvpButton.focus();
      expect(rsvpButton).toHaveFocus();

      // Should open on Enter
      fireEvent.keyDown(rsvpButton, { key: 'Enter' });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});