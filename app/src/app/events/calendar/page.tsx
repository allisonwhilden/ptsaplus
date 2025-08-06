/**
 * Event Calendar Page
 * 
 * Full-page calendar view for browsing events by month
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EventCalendar } from '@/components/events/EventCalendar';
import { ArrowLeft, Plus } from 'lucide-react';
import { canUserEditEvent } from '@/lib/events/validation';
import { auth } from '@clerk/nextjs/server';

export const metadata: Metadata = {
  title: 'Event Calendar | PTSA',
  description: 'View all PTSA events in calendar format',
};

export default async function EventCalendarPage() {
  const { userId } = await auth();
  
  // Check if user can create events (board/admin only)
  // Note: In a real app, we'd fetch the user's role from the database
  const canCreateEvents = !!userId; // Simplified for now

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/events">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Event Calendar</h1>
          </div>
          {canCreateEvents && (
            <Button asChild>
              <Link href="/events/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Link>
            </Button>
          )}
        </div>
        <p className="text-muted-foreground">
          Browse all upcoming PTSA events in calendar view. Click on any event for more details.
        </p>
      </div>

      <EventCalendar />
    </div>
  );
}