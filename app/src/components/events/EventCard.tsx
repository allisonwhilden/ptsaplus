/**
 * EventCard Component
 * 
 * Displays a summary of an event in a card format
 * Used in event lists and grids
 */

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Video, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { EventWithCounts } from '@/lib/events/types';
import { 
  formatEventDate, 
  formatLocation, 
  getCapacityDisplay,
  getEventTimeInfo,
  isEventFull 
} from '@/lib/events/utils';
import { getEventTypeLabel, getEventTypeColor, getLocationTypeIcon } from '@/lib/events/validation';

interface EventCardProps {
  event: EventWithCounts;
  showRSVPStatus?: boolean;
  onRSVP?: (eventId: string) => void;
  compact?: boolean;
}

export function EventCard({ 
  event, 
  showRSVPStatus = true, 
  onRSVP,
  compact = false 
}: EventCardProps) {
  const isPastEvent = new Date(event.end_time) < new Date();
  const isFull = isEventFull(event);
  const LocationIcon = getLocationTypeIcon(event.location_type) === 'MapPin' ? MapPin : Video;
  
  const typeColor = getEventTypeColor(event.type);
  const badgeVariant = typeColor === 'blue' ? 'default' : 
                       typeColor === 'green' ? 'secondary' :
                       typeColor === 'purple' ? 'outline' :
                       'secondary';
  
  return (
    <Card className={`hover:shadow-lg transition-shadow ${isPastEvent ? 'opacity-75' : ''}`}>
      <CardHeader className={compact ? 'pb-3' : ''}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Link 
              href={`/events/${event.id}`}
              className="hover:underline focus:outline-none focus:underline"
            >
              <h3 className="font-semibold text-lg line-clamp-2">{event.title}</h3>
            </Link>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant={badgeVariant} className="text-xs">
                {getEventTypeLabel(event.type)}
              </Badge>
              {event.visibility === 'board' && (
                <Badge variant="outline" className="text-xs">
                  Board Only
                </Badge>
              )}
              {isPastEvent && (
                <Badge variant="secondary" className="text-xs">
                  Past Event
                </Badge>
              )}
            </div>
          </div>
          {showRSVPStatus && event.user_rsvp && (
            <div className="flex items-center gap-1">
              {event.user_rsvp.status === 'attending' && (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              {event.user_rsvp.status === 'not_attending' && (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              {event.user_rsvp.status === 'maybe' && (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className={compact ? 'py-3' : ''}>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">{formatEventDate(event.start_time)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <LocationIcon className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">
              {formatLocation(event.location_type, event.location_details)}
            </span>
          </div>
          
          {event.requires_rsvp && event.capacity && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0" />
              <span className={isFull ? 'text-red-600 font-medium' : ''}>
                {getCapacityDisplay(event)}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0" />
            <span className="text-xs">{getEventTimeInfo(event)}</span>
          </div>
        </div>
        
        {!compact && event.description && (
          <>
            <Separator className="my-3" />
            <p className="text-sm line-clamp-2">{event.description}</p>
          </>
        )}
      </CardContent>
      
      <CardFooter className={`flex gap-2 ${compact ? 'pt-0' : ''}`}>
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link href={`/events/${event.id}`}>
            View Details
          </Link>
        </Button>
        
        {event.requires_rsvp && !isPastEvent && onRSVP && (
          <Button 
            size="sm" 
            variant={event.user_rsvp?.status === 'attending' ? 'secondary' : 'default'}
            onClick={() => onRSVP(event.id)}
            disabled={isFull && !event.user_rsvp}
            className="flex-1"
          >
            {event.user_rsvp?.status === 'attending' ? 'Change RSVP' : 
             event.user_rsvp ? 'Update RSVP' : 
             isFull ? 'Event Full' : 'RSVP'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}