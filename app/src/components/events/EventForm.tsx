/**
 * EventForm Component
 * 
 * Form for creating and editing events
 * Includes volunteer slots management
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Trash2, Users } from 'lucide-react';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { eventFormSchema, volunteerSlotSchema } from '@/lib/events/validation';
import { Event, EventFormData } from '@/lib/events/types';
import { z } from 'zod';

interface EventFormProps {
  event?: Event;
  onSuccess?: () => void;
}

type FormData = z.infer<typeof eventFormSchema>;
type VolunteerSlot = z.infer<typeof volunteerSlotSchema>;

export function EventForm({ event, onSuccess }: EventFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [volunteerSlots, setVolunteerSlots] = useState<VolunteerSlot[]>([]);
  
  const form = useForm<FormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: event?.title || '',
      description: event?.description || '',
      type: event?.type || 'meeting',
      start_time: event ? format(new Date(event.start_time), "yyyy-MM-dd'T'HH:mm") : '',
      end_time: event ? format(new Date(event.end_time), "yyyy-MM-dd'T'HH:mm") : '',
      location_type: event?.location_type || 'in_person',
      location_details: event?.location_details || {},
      capacity: event?.capacity || undefined,
      requires_rsvp: event?.requires_rsvp ?? true,
      allow_guests: event?.allow_guests ?? true,
      visibility: event?.visibility || 'members',
    },
  });
  
  const locationType = form.watch('location_type');
  const eventType = form.watch('type');
  
  const onSubmit = async (data: FormData) => {
    setLoading(true);
    
    try {
      const url = event ? `/api/events/${event.id}` : '/api/events';
      const method = event ? 'PUT' : 'POST';
      
      const body = event ? { event: data } : { event: data, volunteer_slots: volunteerSlots };
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save event');
      }
      
      const savedEvent = await response.json();
      
      toast({
        title: event ? 'Event updated' : 'Event created',
        description: `${data.title} has been ${event ? 'updated' : 'created'} successfully.`,
      });
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/events/${savedEvent.id}`);
      }
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save event',
        variant: 'destructive',
      });
      // Keep form data on error so user doesn't lose their input
    } finally {
      setLoading(false);
    }
  };
  
  const addVolunteerSlot = () => {
    setVolunteerSlots([...volunteerSlots, { title: '', description: '', quantity: 1 }]);
  };
  
  const updateVolunteerSlot = (index: number, field: keyof VolunteerSlot, value: any) => {
    const updated = [...volunteerSlots];
    updated[index] = { ...updated[index], [field]: value };
    setVolunteerSlots(updated);
  };
  
  const removeVolunteerSlot = (index: number) => {
    setVolunteerSlots(volunteerSlots.filter((_, i) => i !== index));
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Event Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Title <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Monthly PTA Meeting" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the event details, agenda, what to bring, etc."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide details to help attendees understand what to expect
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="fundraiser">Fundraiser</SelectItem>
                      <SelectItem value="volunteer">Volunteer Opportunity</SelectItem>
                      <SelectItem value="social">Social Event</SelectItem>
                      <SelectItem value="educational">Educational Event</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        {/* Date and Time */}
        <Card>
          <CardHeader>
            <CardTitle>Date & Time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="location_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="in_person" />
                        </FormControl>
                        <FormLabel className="font-normal">In-Person</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="virtual" />
                        </FormControl>
                        <FormLabel className="font-normal">Virtual</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="hybrid" />
                        </FormControl>
                        <FormLabel className="font-normal">Hybrid (In-Person + Virtual)</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {(locationType === 'in_person' || locationType === 'hybrid') && (
              <>
                <FormField
                  control={form.control}
                  name="location_details.address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="123 School St, City, State 12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location_details.room"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room/Location Details</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Cafeteria, Room 101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
            {(locationType === 'virtual' || locationType === 'hybrid') && (
              <FormField
                control={form.control}
                name="location_details.virtual_link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Virtual Meeting Link <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        type="url" 
                        placeholder="https://zoom.us/j/..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Zoom, Google Meet, or other video conference link
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="location_details.instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Instructions</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Parking information, building access codes, etc."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        {/* RSVP Settings */}
        <Card>
          <CardHeader>
            <CardTitle>RSVP Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="requires_rsvp"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Require RSVP</FormLabel>
                    <FormDescription>
                      Attendees must RSVP to attend this event
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            {form.watch('requires_rsvp') && (
              <>
                <FormField
                  control={form.control}
                  name="allow_guests"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Allow Guests</FormLabel>
                        <FormDescription>
                          Members can bring guests (up to 10)
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity Limit (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Leave blank for unlimited"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum number of attendees (including guests)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Volunteer Slots (only for new events and volunteer type) */}
        {!event && eventType === 'volunteer' && (
          <Card>
            <CardHeader>
              <CardTitle>Volunteer Slots</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {volunteerSlots.map((slot, index) => (
                <div key={index} className="space-y-2 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Slot {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVolunteerSlot(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Slot title (e.g., Setup Crew)"
                    value={slot.title}
                    onChange={(e) => updateVolunteerSlot(index, 'title', e.target.value)}
                  />
                  <Textarea
                    placeholder="Description of tasks"
                    rows={2}
                    value={slot.description}
                    onChange={(e) => updateVolunteerSlot(index, 'description', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Number needed"
                    value={slot.quantity}
                    onChange={(e) => updateVolunteerSlot(index, 'quantity', parseInt(e.target.value) || 1)}
                  />
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addVolunteerSlot}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Volunteer Slot
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Visibility</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="public">Public - Anyone can view</SelectItem>
                      <SelectItem value="members">Members Only</SelectItem>
                      <SelectItem value="board">Board Members Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Who can see and RSVP to this event
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
          </Button>
        </div>
      </form>
    </Form>
  );
}