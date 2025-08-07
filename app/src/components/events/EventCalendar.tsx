/**
 * Event Calendar Component
 * 
 * Displays events in a calendar view with month navigation
 * and event details on hover/click
 */

'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarIcon, Clock, MapPin, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { EventWithCounts } from '@/lib/events/types';
import { getEventTypeColor, getLocationTypeIcon } from '@/lib/events/validation';
import Link from 'next/link';

interface EventCalendarProps {
  initialDate?: Date;
}

export function EventCalendar({ initialDate = new Date() }: EventCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const [currentMonth, setCurrentMonth] = useState<Date>(initialDate);
  const [events, setEvents] = useState<EventWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventWithCounts | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);

  // Fetch events for the current month
  useEffect(() => {
    fetchEvents();
  }, [currentMonth]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const startDate = startOfMonth(currentMonth).toISOString();
      const endDate = endOfMonth(currentMonth).toISOString();
      
      const response = await fetch(`/api/events?start_date=${startDate}&end_date=${endDate}`);
      if (!response.ok) throw new Error('Failed to fetch events');
      
      const data = await response.json();
      setEvents(data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      isSameDay(new Date(event.start_time), date)
    );
  };

  // Check if a date has events
  const hasEvents = (date: Date) => {
    return getEventsForDate(date).length > 0;
  };

  // Handle date click
  const handleDateClick = (date: Date | undefined) => {
    if (!date) return;
    
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length === 1) {
      setSelectedEvent(dayEvents[0]);
      setShowEventDialog(true);
    } else if (dayEvents.length > 1) {
      setSelectedDate(date);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Event Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const newDate = new Date(currentMonth);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setCurrentMonth(newDate);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const newDate = new Date(currentMonth);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setCurrentMonth(newDate);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-muted-foreground">Loading events...</div>
            </div>
          ) : (
            <div className="space-y-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateClick}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="rounded-md border"
                classNames={{
                  nav: "hidden", // We're using custom navigation
                }}
                modifiers={{
                  hasEvents: (date) => hasEvents(date),
                }}
                modifiersClassNames={{
                  hasEvents: "bg-primary/20 font-semibold",
                }}
              />
              
              {/* Show events for selected date */}
              {selectedDate && getEventsForDate(selectedDate).length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="font-semibold text-sm">
                    Events on {format(selectedDate, 'PPP')}
                  </h3>
                  {getEventsForDate(selectedDate).map(event => (
                    <Card 
                      key={event.id} 
                      className="p-3 cursor-pointer hover:bg-accent"
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowEventDialog(true);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-sm">{event.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.start_time), 'h:mm a')} - 
                            {format(new Date(event.end_time), 'h:mm a')}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {event.type}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(selectedEvent.start_time), 'PPp')} - 
                  {format(new Date(selectedEvent.end_time), 'p')}
                </span>
              </div>
              
              {selectedEvent.location_details.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedEvent.location_details.address}</span>
                </div>
              )}
              
              {selectedEvent.description && (
                <p className="text-sm text-muted-foreground">
                  {selectedEvent.description}
                </p>
              )}
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedEvent.type}
                </Badge>
                {selectedEvent.requires_rsvp && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{selectedEvent.rsvp_count} RSVPs</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEventDialog(false)}>
                  Close
                </Button>
                <Button asChild>
                  <Link href={`/events/${selectedEvent.id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}