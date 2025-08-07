/**
 * EventDetails Component
 * 
 * Full event details display with actions
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Video, 
  Clock,
  Download,
  Share2,
  Edit,
  Trash2,
  ExternalLink,
  UserPlus
} from 'lucide-react';
import { EventDetails as EventDetailsType } from '@/lib/events/types';
import { 
  formatEventDateRange, 
  getLocationDisplay,
  getCapacityDisplay,
  downloadICalFile,
  getGoogleCalendarUrl
} from '@/lib/events/utils';
import { getEventTypeLabel, getEventTypeColor, getLocationTypeIcon } from '@/lib/events/validation';
import { RSVPButton } from './RSVPButton';
import { VolunteerSignup } from './VolunteerSignup';
import { useToast } from '@/hooks/use-toast';

interface EventDetailsProps {
  event: EventDetailsType;
  userId?: string;
  onUpdate?: () => void;
}

export function EventDetails({ event, userId, onUpdate }: EventDetailsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isPastEvent = new Date(event.end_time) < new Date();
  const LocationIcon = getLocationTypeIcon(event.location_type) === 'MapPin' ? MapPin : Video;
  
  const typeColor = getEventTypeColor(event.type);
  const badgeVariant = typeColor === 'blue' ? 'default' : 
                       typeColor === 'green' ? 'secondary' :
                       typeColor === 'purple' ? 'outline' :
                       'secondary';
  
  const location = getLocationDisplay(event.location_details, event.location_type);
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete event');
      }
      
      toast({
        title: 'Event deleted',
        description: 'The event has been deleted successfully',
      });
      
      router.push('/events');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive',
      });
    }
  };
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description || `Join us for ${event.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied',
        description: 'Event link has been copied to your clipboard',
      });
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold mb-2">{event.title}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={badgeVariant}>
                    {getEventTypeLabel(event.type)}
                  </Badge>
                  {event.visibility === 'board' && (
                    <Badge variant="outline">Board Only</Badge>
                  )}
                  {isPastEvent && (
                    <Badge variant="secondary">Past Event</Badge>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShare}
                  title="Share event"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                
                {event.can_edit && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      asChild
                      title="Edit event"
                    >
                      <Link href={`/events/${event.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleDelete}
                      title="Delete event"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            {event.description && (
              <p className="text-muted-foreground whitespace-pre-wrap">
                {event.description}
              </p>
            )}
          </div>
        </CardHeader>
      </Card>
      
      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date & Time */}
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date & Time
            </h3>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{formatEventDateRange(event.start_time, event.end_time)}</p>
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadICalFile(event)}
              >
                <Download className="h-4 w-4 mr-2" />
                Add to Calendar
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a
                  href={getGoogleCalendarUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Google
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Location */}
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <LocationIcon className="h-4 w-4" />
              Location
            </h3>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{location.primary}</p>
            {location.secondary && (
              <p className="text-sm text-muted-foreground">{location.secondary}</p>
            )}
            
            {event.location_details.virtual_link && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                asChild
              >
                <a
                  href={event.location_details.virtual_link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Join Virtual Meeting
                </a>
              </Button>
            )}
            
            {event.location_details.address && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                asChild
              >
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(event.location_details.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Get Directions
                </a>
              </Button>
            )}
            
            {event.location_details.instructions && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <p className="text-sm">{event.location_details.instructions}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* RSVP Section */}
      {event.requires_rsvp && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                RSVP
              </h3>
              {event.can_view_attendees && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/events/${event.id}/attendees`}>
                    View Attendees ({event.attending_count})
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {event.capacity && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Capacity</span>
                  <span className="font-medium">{getCapacityDisplay(event)}</span>
                </div>
              )}
              
              {event.allow_guests && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Guests allowed</span>
                  <span className="font-medium">Yes (up to 10 per member)</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-center" id="rsvp">
                <RSVPButton event={event} userId={userId} onUpdate={onUpdate} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Volunteer Slots */}
      {event.volunteer_slots && event.volunteer_slots.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Volunteer Opportunities
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {event.volunteer_slots.map((slot) => (
                <div key={slot.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium">{slot.title}</h4>
                      {slot.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {slot.description}
                        </p>
                      )}
                      <p className="text-sm mt-2">
                        {slot.available_spots > 0 ? (
                          <span className="text-green-600">
                            {slot.available_spots} of {slot.quantity} spots available
                          </span>
                        ) : (
                          <span className="text-red-600">All spots filled</span>
                        )}
                      </p>
                    </div>
                    
                    {!isPastEvent && userId && (
                      <VolunteerSignup
                        eventId={event.id}
                        slot={slot}
                        userId={userId}
                        userSignup={slot.signups.find((s: any) => s.user_id === userId)}
                        onUpdate={onUpdate}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}