/**
 * Create Event Page
 * 
 * Page for creating new events (board/admin only)
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase-server';
import { EventForm } from '@/components/events/EventForm';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Create Event | PTSA Platform',
  description: 'Create a new PTSA event',
};

export default async function CreateEventPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in?redirect_url=/events/new');
  }
  
  const supabase = await createClient();
  
  // Check if user can create events
  const { data: member } = await supabase
    .from('members')
    .select('role')
    .eq('clerk_id', userId)
    .single();
  
  if (!member || (member.role !== 'admin' && member.role !== 'board')) {
    redirect('/events');
  }
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Event</h1>
        <p className="text-muted-foreground">
          Set up a new event for the PTSA community
        </p>
      </div>
      
      <EventForm />
    </div>
  );
}