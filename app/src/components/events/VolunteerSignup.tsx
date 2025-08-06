/**
 * VolunteerSignup Component
 * 
 * Component for signing up for volunteer slots
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { VolunteerSlotWithSignups } from '@/lib/events/types';
import { UserPlus } from 'lucide-react';

interface VolunteerSignupProps {
  eventId: string;
  slot: VolunteerSlotWithSignups;
  userId?: string;
  userSignup?: any;
  onUpdate?: () => void;
}

export function VolunteerSignup({ 
  eventId, 
  slot, 
  userId, 
  userSignup,
  onUpdate 
}: VolunteerSignupProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [quantity, setQuantity] = useState(userSignup?.quantity || 1);
  const [notes, setNotes] = useState(userSignup?.notes || '');
  
  const maxQuantity = Math.min(slot.available_spots + (userSignup?.quantity || 0), 5);
  
  if (!userId) {
    return (
      <Button
        size="sm"
        onClick={() => router.push(`/sign-in?redirect_url=/events/${eventId}`)}
      >
        Sign in to Volunteer
      </Button>
    );
  }
  
  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/events/${eventId}/volunteer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_id: slot.id,
          quantity,
          notes,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to sign up');
      }
      
      toast({
        title: 'Signed up successfully',
        description: `You've signed up for ${quantity} slot${quantity > 1 ? 's' : ''} for ${slot.title}`,
      });
      
      setOpen(false);
      
      if (onUpdate) {
        onUpdate();
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error('Error signing up:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to sign up',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your volunteer signup?')) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(
        `/api/events/${eventId}/volunteer?slot_id=${slot.id}`,
        { method: 'DELETE' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to cancel signup');
      }
      
      toast({
        title: 'Signup cancelled',
        description: 'Your volunteer signup has been cancelled',
      });
      
      if (onUpdate) {
        onUpdate();
      } else {
        router.refresh();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel signup',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (slot.available_spots === 0 && !userSignup) {
    return (
      <Button size="sm" disabled>
        Fully Signed Up
      </Button>
    );
  }
  
  return (
    <>
      <Button
        size="sm"
        variant={userSignup ? 'secondary' : 'default'}
        onClick={() => setOpen(true)}
      >
        <UserPlus className="h-4 w-4 mr-2" />
        {userSignup ? `Signed Up (${userSignup.quantity})` : 'Sign Up'}
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Volunteer for {slot.title}</DialogTitle>
            <DialogDescription>
              {slot.description || 'Sign up to help with this task'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Number of slots</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={maxQuantity}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
              <p className="text-sm text-muted-foreground">
                {slot.available_spots} of {slot.quantity} slots available
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special skills, availability constraints, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            {userSignup && (
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel Signup
              </Button>
            )}
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving...' : userSignup ? 'Update Signup' : 'Sign Up'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}