/**
 * Edit Event Page
 * 
 * Page for editing existing events (board/admin/creator only)
 */

import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase-server';
import { EventForm } from '@/components/events/EventForm';
import { canUserEditEvent } from '@/lib/events/validation';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata: Metadata = {
  title: 'Edit Event | PTSA Platform',
  description: 'Edit event details',
};

export default async function EditEventPage({ params }: PageProps) {
  const { userId } = await auth();
  const { id } = await params;
  
  if (!userId) {
    redirect(`/sign-in?redirect_url=/events/${id}/edit`);
  }
  
  const supabase = await createClient();
  
  // Get event
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();
  
  if (!event) {
    notFound();
  }
  
  // Check if user can edit this event
  const { data: member } = await supabase
    .from('members')
    .select('role')
    .eq('clerk_id', userId)
    .single();
  
  if (!canUserEditEvent(event.created_by, userId, member?.role)) {
    redirect(`/events/${id}`);
  }
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Event</h1>
        <p className="text-muted-foreground">
          Update event details
        </p>
      </div>
      
      <EventForm event={event} />
    </div>
  );
}