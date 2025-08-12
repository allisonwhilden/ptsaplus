import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Settings, 
  FileText,
  Mail,
  UserPlus,
  Download
} from 'lucide-react'

interface QuickActionsProps {
  role: 'admin' | 'board' | 'treasurer' | 'member'
}

export function QuickActions({ role }: QuickActionsProps) {
  const getActions = () => {
    switch (role) {
      case 'admin':
        return [
          { href: '/members', label: 'Manage Members', icon: <Users className="mr-2 h-4 w-4" /> },
          { href: '/events/new', label: 'Create Event', icon: <Calendar className="mr-2 h-4 w-4" /> },
          { href: '/settings/roles', label: 'Manage Roles', icon: <Settings className="mr-2 h-4 w-4" /> },
          { href: '/reports', label: 'Generate Reports', icon: <FileText className="mr-2 h-4 w-4" /> },
        ]
      case 'treasurer':
        return [
          { href: '/payments/report', label: 'Financial Report', icon: <FileText className="mr-2 h-4 w-4" /> },
          { href: '/payments/export', label: 'Export Data', icon: <Download className="mr-2 h-4 w-4" /> },
          { href: '/members?filter=pending', label: 'Pending Dues', icon: <DollarSign className="mr-2 h-4 w-4" /> },
          { href: '/payments/reconcile', label: 'Reconcile', icon: <Settings className="mr-2 h-4 w-4" /> },
        ]
      case 'board':
        return [
          { href: '/events/new', label: 'Create Event', icon: <Calendar className="mr-2 h-4 w-4" /> },
          { href: '/announcements/new', label: 'Send Message', icon: <Mail className="mr-2 h-4 w-4" /> },
          { href: '/members/invite', label: 'Invite Members', icon: <UserPlus className="mr-2 h-4 w-4" /> },
          { href: '/reports/engagement', label: 'View Reports', icon: <FileText className="mr-2 h-4 w-4" /> },
        ]
      default:
        return [
          { href: '/events', label: 'Browse Events', icon: <Calendar className="mr-2 h-4 w-4" /> },
          { href: '/volunteer', label: 'Volunteer', icon: <Users className="mr-2 h-4 w-4" /> },
          { href: '/membership/pay', label: 'Pay Dues', icon: <DollarSign className="mr-2 h-4 w-4" /> },
          { href: '/profile', label: 'My Profile', icon: <Settings className="mr-2 h-4 w-4" /> },
        ]
    }
  }

  const actions = getActions()

  return (
    <div className="space-y-2">
      {actions.map((action) => (
        <Button
          key={action.href}
          variant="outline"
          className="w-full justify-start"
          asChild
        >
          <Link href={action.href}>
            {action.icon}
            {action.label}
          </Link>
        </Button>
      ))}
    </div>
  )
}