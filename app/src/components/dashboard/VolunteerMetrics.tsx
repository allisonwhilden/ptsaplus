import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Users, Clock, TrendingUp } from 'lucide-react'

interface VolunteerSignup {
  id: string
  user_id: string
  quantity: number
  event_volunteer_slots?: {
    title: string
    events?: {
      title: string
      start_time: string
    }
  }
}

interface VolunteerMetricsProps {
  signups: VolunteerSignup[]
}

export function VolunteerMetrics({ signups }: VolunteerMetricsProps) {
  // Calculate metrics
  const uniqueVolunteers = new Set(signups.map(s => s.user_id)).size
  const totalSlots = signups.reduce((sum, s) => sum + s.quantity, 0)
  const averagePerEvent = signups.length > 0 ? (totalSlots / signups.length).toFixed(1) : 0
  
  // Group signups by event
  const eventGroups = signups.reduce((acc, signup) => {
    const eventTitle = signup.event_volunteer_slots?.events?.title || 'Unknown Event'
    if (!acc[eventTitle]) {
      acc[eventTitle] = {
        title: eventTitle,
        startTime: signup.event_volunteer_slots?.events?.start_time || '',
        slots: []
      }
    }
    acc[eventTitle].slots.push({
      role: signup.event_volunteer_slots?.title || 'Volunteer',
      quantity: signup.quantity
    })
    return acc
  }, {} as Record<string, any>)

  const upcomingEvents = Object.values(eventGroups)
    .filter(event => new Date(event.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5)

  return (
    <div>
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-accent rounded-lg">
          <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
          <p className="text-lg font-bold">{uniqueVolunteers}</p>
          <p className="text-xs text-muted-foreground">Volunteers</p>
        </div>
        <div className="text-center p-2 bg-accent rounded-lg">
          <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
          <p className="text-lg font-bold">{totalSlots}</p>
          <p className="text-xs text-muted-foreground">Total Slots</p>
        </div>
        <div className="text-center p-2 bg-accent rounded-lg">
          <TrendingUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
          <p className="text-lg font-bold">{averagePerEvent}</p>
          <p className="text-xs text-muted-foreground">Avg/Event</p>
        </div>
      </div>

      {/* Upcoming Events with Volunteers */}
      <ScrollArea className="h-[200px]">
        <div className="space-y-3">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event, index) => (
              <div key={index} className="border rounded-lg p-3">
                <p className="font-medium text-sm mb-1">{event.title}</p>
                <p className="text-xs text-muted-foreground mb-2">
                  {new Date(event.startTime).toLocaleDateString()}
                </p>
                <div className="space-y-1">
                  {event.slots.map((slot: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-xs">{slot.role}</span>
                      <Badge variant="secondary" className="text-xs">
                        {slot.quantity} signed up
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No volunteer signups yet
            </p>
          )}
        </div>
      </ScrollArea>

      {/* Volunteer Fill Rate */}
      <div className="mt-4 p-3 bg-accent rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Volunteer Fill Rate</span>
          <span className="text-sm font-bold">75%</span>
        </div>
        <Progress value={75} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1">
          Good participation - consider recognizing top volunteers!
        </p>
      </div>
    </div>
  )
}