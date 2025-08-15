import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSupabaseServiceClient } from '@/lib/supabase-server'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Mail, 
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Calendar,
  Filter
} from 'lucide-react'

export default async function EmailHistoryPage() {
  const supabase = getSupabaseServiceClient()
  const user = await currentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  // Check if user is admin or board member
  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('clerk_id', user.id)
    .single()

  if (!member || !['admin', 'board'].includes(member.role)) {
    redirect('/dashboard')
  }

  // Fetch email history
  const { data: emailLogs } = await supabase
    .from('email_logs')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(100)

  // Calculate statistics
  const totalEmails = emailLogs?.length || 0
  const sentEmails = emailLogs?.filter(e => e.status === 'sent').length || 0
  const scheduledEmails = emailLogs?.filter(e => e.status === 'scheduled').length || 0
  const failedEmails = emailLogs?.filter(e => e.status === 'failed').length || 0

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-800">Sent</Badge>
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTemplateLabel = (template: string) => {
    const labels: Record<string, string> = {
      welcome: 'Welcome Email',
      payment_confirmation: 'Payment Confirmation',
      event_reminder: 'Event Reminder',
      announcement: 'Announcement',
      volunteer_reminder: 'Volunteer Reminder',
      meeting_minutes: 'Meeting Minutes',
    }
    return labels[template] || template
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEmails}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sent</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sentEmails}</div>
              <p className="text-xs text-muted-foreground">Successfully delivered</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scheduledEmails}</div>
              <p className="text-xs text-muted-foreground">Pending delivery</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{failedEmails}</div>
              <p className="text-xs text-muted-foreground">Delivery failed</p>
            </CardContent>
          </Card>
        </div>

        {/* Email List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Email History</CardTitle>
                <CardDescription>View all sent and scheduled emails</CardDescription>
              </div>
              <Link href="/communications/email/compose">
                <Button>
                  <Mail className="h-4 w-4 mr-2" />
                  Compose New Email
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {emailLogs && emailLogs.length > 0 ? (
              <div className="space-y-4">
                <div className="rounded-lg border">
                  <div className="grid grid-cols-12 gap-4 p-4 font-medium text-sm text-muted-foreground border-b bg-gray-50">
                    <div className="col-span-3">Date</div>
                    <div className="col-span-3">Subject</div>
                    <div className="col-span-2">Template</div>
                    <div className="col-span-2">Recipients</div>
                    <div className="col-span-2">Status</div>
                  </div>
                  {emailLogs.map((log) => (
                    <div key={log.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors">
                      <div className="col-span-3">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {new Date(log.sent_at).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(log.sent_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <p className="text-sm font-medium truncate">{log.subject}</p>
                      </div>
                      <div className="col-span-2">
                        <Badge variant="outline">
                          {getTemplateLabel(log.template_type)}
                        </Badge>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{log.recipient_count}</span>
                        </div>
                      </div>
                      <div className="col-span-2">
                        {getStatusBadge(log.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No emails sent yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Start by composing your first email to members
                </p>
                <Link href="/communications/email/compose">
                  <Button>
                    <Mail className="h-4 w-4 mr-2" />
                    Compose First Email
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}