/**
 * RSVPButton Component
 * 
 * Quick RSVP component with guest count
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { EventWithCounts, RSVPStatus } from '@/lib/events/types';
import { isEventFull } from '@/lib/events/utils';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface RSVPButtonProps {
  event: EventWithCounts;
  userId?: string;
  onUpdate?: () => void;
}

export function RSVPButton({ event, userId, onUpdate }: RSVPButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [status, setStatus] = useState<RSVPStatus>(
    event.user_rsvp?.status || 'attending'
  );
  const [guestCount, setGuestCount] = useState(
    event.user_rsvp?.guest_count || 0
  );
  const [notes, setNotes] = useState(event.user_rsvp?.notes || '');
  
  const isFull = isEventFull(event);
  const isAttending = event.user_rsvp?.status === 'attending';
  const isPastEvent = new Date(event.start_time) < new Date();
  
  if (!userId) {
    return (
      <Button
        onClick={() => router.push(`/sign-in?redirect_url=/events/${event.id}`)}
        disabled={isPastEvent}
      >
        Sign in to RSVP
      </Button>
    );
  }
  
  if (isPastEvent) {
    return null;
  }
  
  if (!event.requires_rsvp) {
    return null;
  }
  
  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/events/${event.id}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          guest_count: status === 'attending' ? guestCount : 0,
          notes,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to RSVP');
      }
      
      toast({
        title: 'RSVP updated',
        description: status === 'attending' 
          ? `You're attending ${event.title}${guestCount > 0 ? ` with ${guestCount} guest${guestCount > 1 ? 's' : ''}` : ''}`
          : status === 'not_attending'
          ? `You've declined ${event.title}`
          : `You're a maybe for ${event.title}`,
      });
      
      setOpen(false);
      
      if (onUpdate) {
        onUpdate();
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error('Error submitting RSVP:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update RSVP',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/events/${event.id}/rsvp`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel RSVP');
      }
      
      toast({
        title: 'RSVP cancelled',
        description: 'Your RSVP has been cancelled',
      });
      
      if (onUpdate) {
        onUpdate();
      } else {
        router.refresh();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel RSVP',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const getButtonProps = () => {
    if (event.user_rsvp) {
      const statusIcons = {
        attending: <CheckCircle className="h-4 w-4 mr-2" />,
        not_attending: <XCircle className="h-4 w-4 mr-2" />,
        maybe: <AlertCircle className="h-4 w-4 mr-2" />,
      };
      
      return {
        children: (
          <>
            {statusIcons[event.user_rsvp.status]}
            {event.user_rsvp.status === 'attending' ? 'Attending' :
             event.user_rsvp.status === 'not_attending' ? 'Not Attending' : 'Maybe'}
          </>
        ),
        variant: 'secondary' as const,
      };
    }
    
    if (isFull) {
      return {
        children: 'Event Full',
        disabled: true,
      };
    }
    
    return {
      children: 'RSVP',
      variant: 'default' as const,
    };
  };
  
  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        {...getButtonProps()}
      />
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>RSVP for {event.title}</DialogTitle>
            <DialogDescription>
              Let us know if you'll be attending this event
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Will you attend?</Label>
              <RadioGroup value={status} onValueChange={(value) => setStatus(value as RSVPStatus)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="attending" id="attending" />
                  <Label htmlFor="attending" className="font-normal">
                    Yes, I'll be there
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="not_attending" id="not_attending" />
                  <Label htmlFor="not_attending" className="font-normal">
                    No, I can't make it
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="maybe" id="maybe" />
                  <Label htmlFor="maybe" className="font-normal">
                    Maybe
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            {status === 'attending' && event.allow_guests && (
              <div className="space-y-2">
                <Label htmlFor="guests">Number of guests</Label>
                <Input
                  id="guests"
                  type="number"
                  min="0"
                  max="10"
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value) || 0)}
                />
                <p className="text-sm text-muted-foreground">
                  You can bring up to 10 guests
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any dietary restrictions, questions, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            {event.user_rsvp && (
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel RSVP
              </Button>
            )}
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving...' : 'Save RSVP'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}