import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSupabaseServiceClient } from '@/lib/supabase-server'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { EventCalendarWidget } from '@/components/dashboard/EventCalendarWidget'
import { VolunteerMetrics } from '@/components/dashboard/VolunteerMetrics'
import { MemberEngagement } from '@/components/dashboard/MemberEngagement'
import { CommitteeActivity } from '@/components/dashboard/CommitteeActivity'
import { 
  Calendar,
  Users,
  Heart,
  Activity,
  CheckSquare,
  MessageSquare,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'

export default async function BoardDashboardPage() {
  const supabase = getSupabaseServiceClient()
  const user = await currentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  // Check if user is board member or admin
  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('clerk_id', user.id)
    .single()

  if (!member || !['admin', 'board', 'committee_chair'].includes(member.role)) {
    redirect('/dashboard')
  }

  // Fetch board-relevant data
  const [
    { data: upcomingEvents },
    { data: volunteerSignups },
    { data: activeMembers },
    { data: recentRsvps },
    { count: totalVolunteers }
  ] = await Promise.all([
    supabase
      .from('events')
      .select('*')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(10),
    supabase
      .from('event_volunteer_signups')
      .select(`
        *,
        event_volunteer_slots (
          title,
          event_id,
          events (title, start_time)
        )
      `)
      .limit(20),
    supabase
      .from('members')
      .select('*')
      .eq('membership_status', 'active'),
    supabase
      .from('event_rsvps')
      .select(`
        *,
        events (title, start_time)
      `)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('event_volunteer_signups')
      .select('user_id', { count: 'exact', head: true })
  ])

  // Calculate engagement metrics
  const totalMembers = activeMembers?.length || 0
  const volunteersCount = totalVolunteers || 0
  const engagementRate = totalMembers > 0 ? ((volunteersCount / totalMembers) * 100).toFixed(1) : 0
  const upcomingCount = upcomingEvents?.length || 0
  const avgRsvps = recentRsvps ? (recentRsvps.length / (upcomingEvents?.length || 1)).toFixed(1) : 0

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Board Dashboard</h1>
            <p className="text-muted-foreground">Organization overview and management</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/events/new">Create Event</Link>
            </Button>
            <Button asChild>
              <Link href="/announcements/new">New Announcement</Link>
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatsCard
            title="Upcoming Events"
            value={upcomingCount}
            icon={<Calendar className="h-4 w-4" />}
            description="Next 30 days"
            trend={`${avgRsvps} avg RSVPs`}
          />
          <StatsCard
            title="Active Members"
            value={totalMembers}
            icon={<Users className="h-4 w-4" />}
            description="Current members"
            trend="+5% this month"
          />
          <StatsCard
            title="Volunteer Rate"
            value={`${engagementRate}%`}
            icon={<Heart className="h-4 w-4" />}
            description="Member participation"
            trend={`${volunteersCount} volunteers`}
          />
          <StatsCard
            title="Engagement Score"
            value="82"
            icon={<Activity className="h-4 w-4" />}
            description="Overall health"
            trend="+3 points"
            trendColor="text-green-600"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 lg:grid-cols-3 mb-8">
          {/* Upcoming Events */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Events scheduled for the next 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <EventCalendarWidget events={upcomingEvents || []} />
            </CardContent>
          </Card>

          {/* Volunteer Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Volunteer Activity</CardTitle>
              <CardDescription>Recent volunteer signups</CardDescription>
            </CardHeader>
            <CardContent>
              <VolunteerMetrics signups={volunteerSignups || []} />
            </CardContent>
          </Card>
        </div>

        {/* Secondary Content Grid */}
        <div className="grid gap-4 lg:grid-cols-2 mb-8">
          {/* Member Engagement */}
          <Card>
            <CardHeader>
              <CardTitle>Member Engagement</CardTitle>
              <CardDescription>Participation trends and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <MemberEngagement 
                totalMembers={totalMembers}
                activeVolunteers={volunteersCount}
                recentRsvps={recentRsvps?.length || 0}
              />
            </CardContent>
          </Card>

          {/* Committee Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Committee Activity</CardTitle>
              <CardDescription>Updates from committee chairs</CardDescription>
            </CardHeader>
            <CardContent>
              <CommitteeActivity />
            </CardContent>
          </Card>
        </div>

        {/* Action Items */}
        <Card>
          <CardHeader>
            <CardTitle>Board Action Items</CardTitle>
            <CardDescription>Tasks requiring board attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Review pending member applications</p>
                  <p className="text-sm text-muted-foreground">3 applications waiting for approval</p>
                </div>
                <Button size="sm" variant="outline" className="ml-auto">Review</Button>
              </div>
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Respond to member feedback</p>
                  <p className="text-sm text-muted-foreground">5 new suggestions received</p>
                </div>
                <Button size="sm" variant="outline" className="ml-auto">View</Button>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Review monthly financial report</p>
                  <p className="text-sm text-muted-foreground">Treasurer's report ready for review</p>
                </div>
                <Button size="sm" variant="outline" className="ml-auto">Open</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}