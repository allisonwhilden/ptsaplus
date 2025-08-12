import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Mail } from 'lucide-react'

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

  return (
    <div>
      <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <p className="text-sm font-medium">Total Outstanding</p>
        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
          ${totalOutstanding.toFixed(2)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          From {members.length} pending members
        </p>
      </div>

      <ScrollArea className="h-[200px]">
        <div className="space-y-3">
          {members.length > 0 ? (
            members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {member.first_name} {member.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {member.membership_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Due: ${getDueAmount(member.membership_type)}
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="ghost">
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No outstanding dues
            </p>
          )}
        </div>
      </ScrollArea>

      {members.length > 0 && (
        <div className="mt-4 flex gap-2">
          <Button size="sm" className="flex-1">
            Send Reminders
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            Export List
          </Button>
        </div>
      )}
    </div>
  )
}