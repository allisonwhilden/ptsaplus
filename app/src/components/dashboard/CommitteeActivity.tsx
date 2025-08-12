import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Users, Calendar, Target, MessageSquare } from 'lucide-react'

// Mock data - in production, this would come from API
const committees = [
  {
    id: '1',
    name: 'Fundraising Committee',
    chair: 'Sarah Johnson',
    members: 8,
    lastActivity: '2 days ago',
    status: 'active',
    recentUpdate: 'Planning spring carnival - vendor list confirmed',
    icon: <Target className="h-4 w-4" />,
  },
  {
    id: '2',
    name: 'Events Committee',
    chair: 'Michael Chen',
    members: 12,
    lastActivity: '1 day ago',
    status: 'active',
    recentUpdate: 'Teacher appreciation week schedule finalized',
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    id: '3',
    name: 'Communications',
    chair: 'Emily Rodriguez',
    members: 5,
    lastActivity: '3 hours ago',
    status: 'active',
    recentUpdate: 'Newsletter draft ready for review',
    icon: <MessageSquare className="h-4 w-4" />,
  },
  {
    id: '4',
    name: 'Volunteer Coordination',
    chair: 'David Kim',
    members: 6,
    lastActivity: '1 week ago',
    status: 'needs-attention',
    recentUpdate: 'Need more volunteers for book fair',
    icon: <Users className="h-4 w-4" />,
  },
]

export function CommitteeActivity() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400">Active</Badge>
      case 'needs-attention':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400">Needs Attention</Badge>
      default:
        return <Badge variant="secondary">Inactive</Badge>
    }
  }

  const activeCommittees = committees.filter(c => c.status === 'active').length
  const totalMembers = committees.reduce((sum, c) => sum + c.members, 0)

  return (
    <div>
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-accent rounded-lg">
          <p className="text-lg font-bold">{committees.length}</p>
          <p className="text-xs text-muted-foreground">Committees</p>
        </div>
        <div className="text-center p-2 bg-accent rounded-lg">
          <p className="text-lg font-bold">{activeCommittees}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </div>
        <div className="text-center p-2 bg-accent rounded-lg">
          <p className="text-lg font-bold">{totalMembers}</p>
          <p className="text-xs text-muted-foreground">Total Members</p>
        </div>
      </div>

      {/* Committee List */}
      <ScrollArea className="h-[280px] pr-4">
        <div className="space-y-3">
          {committees.map((committee) => (
            <div key={committee.id} className="border rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {committee.icon}
                  <div>
                    <p className="font-medium text-sm">{committee.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Chair: {committee.chair}
                    </p>
                  </div>
                </div>
                {getStatusBadge(committee.status)}
              </div>
              
              <p className="text-xs text-muted-foreground mb-2">
                {committee.recentUpdate}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {committee.members} members
                  </span>
                  <span>{committee.lastActivity}</span>
                </div>
                <Button size="sm" variant="ghost" className="h-7 text-xs">
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      <div className="mt-4 flex gap-2">
        <Button size="sm" variant="outline" className="flex-1">
          Schedule Meeting
        </Button>
        <Button size="sm" className="flex-1">
          Send Update
        </Button>
      </div>
    </div>
  )
}