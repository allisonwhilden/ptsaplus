/**
 * Events List Page
 * 
 * Main events page showing all events with filtering
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase-server';
import { EventList } from '@/components/events/EventList';
import { Button } from '@/components/ui/button';
import { Plus, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Events | PTSA Platform',
  description: 'View and RSVP to upcoming PTSA events',
};

export default async function EventsPage() {
  const { userId } = await auth();
  const supabase = await createClient();
  
  // Check if user can create events
  let canCreateEvents = false;
  if (userId) {
    const { data: member } = await supabase
      .from('members')
      .select('role')
      .eq('clerk_id', userId)
      .single();
    
    canCreateEvents = member?.role === 'admin' || member?.role === 'board';
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Events</h1>
          <p className="text-muted-foreground">
            Stay updated with PTSA meetings, fundraisers, and activities
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/events/calendar">
              <Calendar className="h-4 w-4 mr-2" />
              Calendar View
            </Link>
          </Button>
          {canCreateEvents && (
            <Button asChild>
              <Link href="/events/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Link>
            </Button>
          )}
        </div>
      </div>
      
      <EventList />
    </div>
  );
}