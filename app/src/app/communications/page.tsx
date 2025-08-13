import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSupabaseServiceClient } from '@/lib/supabase-server'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EnhancedStatsCard } from '@/components/dashboard/EnhancedStatsCard'
import Link from 'next/link'
import { 
  Mail, 
  Send,
  MessageSquare,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

export default async function CommunicationsPage() {
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

  // Fetch communication stats
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Get email stats for this month
  const { data: emailStats } = await supabase
    .from('email_logs')
    .select('id', { count: 'exact' })
    .gte('sent_at', startOfMonth.toISOString())

  // Get active announcements count
  const { data: activeAnnouncements } = await supabase
    .from('announcements')
    .select('id', { count: 'exact' })
    .gte('published_at', now.toISOString())
    .or(`expires_at.is.null,expires_at.gt.${now.toISOString()}`)

  // Get scheduled items count
  const { data: scheduledAnnouncements } = await supabase
    .from('announcements')
    .select('id', { count: 'exact' })
    .gt('published_at', now.toISOString())

  const { data: scheduledEmails } = await supabase
    .from('email_queue')
    .select('id', { count: 'exact' })
    .eq('status', 'pending')
    .gt('scheduled_for', now.toISOString())

  const emailsSent = emailStats?.length || 0
  const activeCount = activeAnnouncements?.length || 0
  const scheduledCount = (scheduledAnnouncements?.length || 0) + (scheduledEmails?.length || 0)

  // Get recent activity
  const { data: recentEmails } = await supabase
    .from('email_logs')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(5)

  const { data: recentAnnouncements } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <EnhancedStatsCard
            title="Emails This Month"
            value={emailsSent}
            icon={<Mail className="h-5 w-5" />}
            description="Total emails sent"
            trend={{ value: emailsSent > 0 ? `+${emailsSent}` : '0', direction: emailsSent > 0 ? 'up' : 'neutral' }}
          />
          <EnhancedStatsCard
            title="Active Announcements"
            value={activeCount}
            icon={<MessageSquare className="h-5 w-5" />}
            description="Currently visible"
            trend={{ value: `${activeCount}`, direction: 'neutral' }}
          />
          <EnhancedStatsCard
            title="Scheduled Items"
            value={scheduledCount}
            icon={<Clock className="h-5 w-5" />}
            description="Pending delivery"
            trend={{ value: scheduledCount > 0 ? `+${scheduledCount}` : '0', direction: scheduledCount > 0 ? 'up' : 'neutral' }}
          />
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Start a new communication task</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Link href="/communications/email/compose">
                <Button className="w-full h-24 flex flex-col gap-2" variant="outline">
                  <Send className="h-6 w-6" />
                  <span>Compose Email</span>
                </Button>
              </Link>
              <Link href="/communications/announcements/new">
                <Button className="w-full h-24 flex flex-col gap-2" variant="outline">
                  <MessageSquare className="h-6 w-6" />
                  <span>Create Announcement</span>
                </Button>
              </Link>
              <Link href="/communications/email/history">
                <Button className="w-full h-24 flex flex-col gap-2" variant="outline">
                  <Mail className="h-6 w-6" />
                  <span>Email History</span>
                </Button>
              </Link>
              <Link href="/communications/announcements">
                <Button className="w-full h-24 flex flex-col gap-2" variant="outline">
                  <Calendar className="h-6 w-6" />
                  <span>Manage Announcements</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Emails</CardTitle>
              <CardDescription>Latest email communications</CardDescription>
            </CardHeader>
            <CardContent>
              {recentEmails && recentEmails.length > 0 ? (
                <div className="space-y-4">
                  {recentEmails.map((email) => (
                    <div key={email.id} className="flex items-start space-x-4">
                      <div className="mt-1">
                        {email.status === 'sent' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{email.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(email.sent_at).toLocaleDateString()} • {email.template_type}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {email.recipient_count} recipients
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent emails</p>
              )}
              <div className="mt-4">
                <Link href="/communications/email/history">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Emails
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Announcements</CardTitle>
              <CardDescription>Latest announcements created</CardDescription>
            </CardHeader>
            <CardContent>
              {recentAnnouncements && recentAnnouncements.length > 0 ? (
                <div className="space-y-4">
                  {recentAnnouncements.map((announcement) => (
                    <div key={announcement.id} className="flex items-start space-x-4">
                      <div className="mt-1">
                        {announcement.type === 'urgent' ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{announcement.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(announcement.created_at).toLocaleDateString()} • {announcement.audience}
                        </p>
                      </div>
                      {announcement.is_pinned && (
                        <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Pinned
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent announcements</p>
              )}
              <div className="mt-4">
                <Link href="/communications/announcements">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Announcements
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}