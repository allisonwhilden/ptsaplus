/**
 * Event Attendees Page
 * 
 * View list of event attendees (organizers/board/admin only)
 */

import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase-server';
import { canUserViewAttendees } from '@/lib/events/validation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Download, Mail, Phone, Users } from 'lucide-react';
import { format } from 'date-fns';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata: Metadata = {
  title: 'Event Attendees | PTSA Platform',
  description: 'View event attendee list',
};

export default async function AttendeesPage({ params }: PageProps) {
  const { userId } = await auth();
  const { id } = await params;
  
  if (!userId) {
    redirect(`/sign-in?redirect_url=/events/${id}/attendees`);
  }
  
  const supabase = await createClient();
  
  // Get event details
  const { data: event } = await supabase
    .from('events')
    .select('id, title, created_by, start_time')
    .eq('id', id)
    .single();
  
  if (!event) {
    notFound();
  }
  
  // Check permissions
  const { data: member } = await supabase
    .from('members')
    .select('role')
    .eq('clerk_id', userId)
    .single();
  
  if (!canUserViewAttendees(event.created_by, userId, member?.role)) {
    redirect(`/events/${id}`);
  }
  
  // Get attendees
  const { data: attendees } = await supabase
    .from('event_rsvps')
    .select(`
      *,
      member:members!inner(
        id,
        first_name,
        last_name,
        email,
        phone
      )
    `)
    .eq('event_id', id)
    .eq('status', 'attending')
    .order('created_at', { ascending: true });
  
  const attendeeList = attendees || [];
  const totalAttendees = attendeeList.reduce(
    (sum, attendee) => sum + 1 + attendee.guest_count,
    0
  );
  
  // Export as CSV
  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Guests', 'RSVP Date', 'Notes'];
    const rows = attendeeList.map(attendee => [
      `${attendee.member.first_name} ${attendee.member.last_name}`,
      attendee.member.email || '',
      attendee.member.phone || '',
      attendee.guest_count.toString(),
      format(new Date(attendee.created_at), 'MM/dd/yyyy'),
      attendee.notes || '',
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}_attendees.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href={`/events/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Event
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Event Attendees
              </CardTitle>
              <p className="text-muted-foreground mt-1">{event.title}</p>
            </div>
            <Button variant="outline" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-4">
            <Badge variant="secondary" className="text-sm">
              {attendeeList.length} Members
            </Badge>
            <Badge variant="secondary" className="text-sm">
              {totalAttendees - attendeeList.length} Guests
            </Badge>
            <Badge className="text-sm">
              {totalAttendees} Total Attendees
            </Badge>
          </div>
          
          {attendeeList.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No attendees have RSVPed yet
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-center">Guests</TableHead>
                    <TableHead>RSVP Date</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendeeList.map((attendee) => (
                    <TableRow key={attendee.id}>
                      <TableCell className="font-medium">
                        {attendee.member.first_name} {attendee.member.last_name}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {attendee.member.email && (
                            <a
                              href={`mailto:${attendee.member.email}`}
                              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                            >
                              <Mail className="h-3 w-3" />
                              {attendee.member.email}
                            </a>
                          )}
                          {attendee.member.phone && (
                            <a
                              href={`tel:${attendee.member.phone}`}
                              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                            >
                              <Phone className="h-3 w-3" />
                              {attendee.member.phone}
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {attendee.guest_count > 0 && (
                          <Badge variant="outline">+{attendee.guest_count}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(attendee.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {attendee.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}