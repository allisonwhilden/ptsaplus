import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Mail, HelpCircle, Clock } from 'lucide-react'
import { useState } from 'react'

interface Member {
  id: string
  first_name: string
  last_name: string
  email: string
  membership_type: string
  joined_at: string
}

interface OutstandingDuesProps {
  members: Member[]
}

export function OutstandingDues({ members }: OutstandingDuesProps) {
  const [showHelp, setShowHelp] = useState(false)
  
  const getDueAmount = (type: string) => {
    switch (type) {
      case 'family':
        return 25
      case 'teacher':
        return 15
      default:
        return 15
    }
  }

  const totalOutstanding = members.reduce((sum, member) => 
    sum + getDueAmount(member.membership_type), 0
  )

  const getDaysOverdue = (joinedAt: string) => {
    const joinDate = new Date(joinedAt)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - joinDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div>
      {/* Header with help */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium">Families Who Haven't Paid Yet</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHelp(!showHelp)}
          className="h-8 w-8 p-0"
        >
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      {showHelp && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>What this means:</strong> These families signed up but haven't paid their membership fees yet. 
            It's normal to have some pending payments - people are busy! You can send friendly reminders or 
            export the list to follow up personally.
          </p>
        </div>
      )}

      <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Money we're still waiting for</p>
          {members.length > 10 && (
            <Badge variant="outline" className="text-red-600 border-red-600">
              High volume
            </Badge>
          )}
        </div>
        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
          ${totalOutstanding.toFixed(2)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          From {members.length} {members.length === 1 ? 'family' : 'families'}
        </p>
      </div>

      <ScrollArea className="h-[200px]">
        <div className="space-y-3">
          {members.length > 0 ? (
            members.map((member) => {
              const daysWaiting = getDaysOverdue(member.joined_at)
              const isUrgent = daysWaiting > 14
              
              return (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">
                        {member.first_name} {member.last_name}
                      </p>
                      {isUrgent && (
                        <Badge variant="destructive" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {daysWaiting} days
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{member.email}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {member.membership_type === 'family' ? 'Family ($25)' : 
                         member.membership_type === 'teacher' ? 'Teacher ($15)' : 
                         'Individual ($15)'}
                      </Badge>
                      {!isUrgent && (
                        <span className="text-xs text-muted-foreground">
                          Waiting {daysWaiting} {daysWaiting === 1 ? 'day' : 'days'}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" title="Send reminder email">
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>
              )
            })
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">Great news! Everyone has paid their dues.</p>
              <p className="text-xs text-muted-foreground mt-1">No follow-up needed right now.</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {members.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            <Button size="sm" className="flex-1">
              Send Friendly Reminders
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              Download List
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Reminder emails are automatically friendly and professional
          </p>
        </div>
      )}
    </div>
  )
}