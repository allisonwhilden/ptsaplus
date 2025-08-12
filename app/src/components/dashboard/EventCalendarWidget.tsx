import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, Users } from 'lucide-react'
import Link from 'next/link'

interface Event {
  id: string
  title: string
  type: string
  start_time: string
  end_time: string
  location_type: string
  location_details?: any
  capacity?: number
}

interface EventCalendarWidgetProps {
  events: Event[]
}

export function EventCalendarWidget({ events }: EventCalendarWidgetProps) {
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400'
      case 'fundraiser':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400'
      case 'volunteer':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400'
      case 'social':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-400'
      case 'educational':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400'
    }
  }

  const formatEventDate = (startTime: string) => {
    const date = new Date(startTime)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatEventTime = (startTime: string) => {
    const date = new Date(startTime)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-4">
        {events.length > 0 ? (
          events.map((event) => (
            <div key={event.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium">{event.title}</h4>
                  <Badge className={`mt-1 ${getEventTypeColor(event.type)}`}>
                    {event.type}
                  </Badge>
                </div>
                <Button size="sm" variant="ghost" asChild>
                  <Link href={`/events/${event.id}`}>View</Link>
                </Button>
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>{formatEventDate(event.start_time)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span>{formatEventTime(event.start_time)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  <span className="capitalize">{event.location_type.replace('_', ' ')}</span>
                </div>
                {event.capacity && (
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    <span>Capacity: {event.capacity}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No upcoming events scheduled</p>
            <Button className="mt-4" asChild>
              <Link href="/events/new">Create First Event</Link>
            </Button>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}