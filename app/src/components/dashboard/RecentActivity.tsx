import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Users, DollarSign, Calendar, UserPlus } from 'lucide-react'

interface Payment {
  id: string
  amount: number
  type: string
  created_at: string
  status: string
}

interface Member {
  id: string
  first_name: string
  last_name: string
  created_at: string
  membership_type: string
}

interface RecentActivityProps {
  payments?: Payment[]
  members?: Member[]
}

export function RecentActivity({ payments = [], members = [] }: RecentActivityProps) {
  // Combine and sort activities by date
  const activities = [
    ...payments.map(p => ({
      id: p.id,
      type: 'payment' as const,
      title: `Payment received`,
      description: `$${(p.amount / 100).toFixed(2)} ${p.type}`,
      timestamp: p.created_at,
      icon: <DollarSign className="h-4 w-4" />,
      color: 'text-green-600'
    })),
    ...members.map(m => ({
      id: m.id,
      type: 'member' as const,
      title: `New member joined`,
      description: `${m.first_name} ${m.last_name}`,
      timestamp: m.created_at,
      icon: <UserPlus className="h-4 w-4" />,
      color: 'text-blue-600'
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8) // Show only the 8 most recent activities

  return (
    <ScrollArea className="h-[300px] pr-4">
      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`mt-0.5 ${activity.color}`}>
                {activity.icon}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{activity.title}</p>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(activity.timestamp).toLocaleDateString()} at{' '}
                  {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
        )}
      </div>
    </ScrollArea>
  )
}