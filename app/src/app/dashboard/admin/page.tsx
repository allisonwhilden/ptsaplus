import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSupabaseServiceClient } from '@/lib/supabase-server'
import { getMemberStats, getRevenueStats, getUpcomingEvents } from '@/lib/dashboard-queries'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnhancedStatsCard } from '@/components/dashboard/EnhancedStatsCard'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { MembershipTrends } from '@/components/dashboard/MembershipTrends'
import { EventAnalytics } from '@/components/dashboard/EventAnalytics'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { 
  Users, 
  DollarSign, 
  Calendar,
  UserCheck
} from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = getSupabaseServiceClient()
  const user = await currentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  // Check if user is admin
  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('clerk_id', user.id)
    .single()

  if (!member || member.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch data using cached queries for better performance
  const [memberStats, revenueStats, upcomingEventsList] = await Promise.all([
    getMemberStats(),
    getRevenueStats('month'),
    getUpcomingEvents(10)
  ])

  // Fetch non-cached recent data
  const { data: recentMembers } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentPayments } = await supabase
    .from('payments')
    .select('*')
    .eq('status', 'succeeded')
    .order('created_at', { ascending: false })
    .limit(5)

  // Use cached data
  const totalMembers = memberStats.total
  const activeMembers = memberStats.active
  const totalRevenue = revenueStats.total
  const upcomingEvents = upcomingEventsList.length

  // Calculate metrics for context
  const membershipRate = totalMembers ? ((activeMembers || 0) / totalMembers * 100).toFixed(1) : 0
  const avgRevenue = activeMembers ? (totalRevenue / activeMembers).toFixed(2) : 0

  // Determine status levels
  const getMembershipStatus = () => {
    const rate = parseFloat(membershipRate.toString())
    if (rate >= 80) return 'excellent'
    if (rate >= 60) return 'good'
    if (rate >= 40) return 'warning'
    return 'critical'
  }

  const getRevenueStatus = () => {
    const avg = parseFloat(avgRevenue.toString())
    if (avg >= 50) return 'excellent'
    if (avg >= 25) return 'good'
    if (avg >= 15) return 'warning'
    return 'critical'
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and management tools</p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <EnhancedStatsCard
            title="Total Members"
            value={totalMembers || 0}
            icon={<Users className="h-4 w-4" />}
            description="All registered members"
            trend={{
              value: "+12% from last month",
              direction: "up",
              isGood: true
            }}
            helpText="Total number of families registered in the system, including both active and inactive memberships."
            benchmark={{
              value: "250",
              label: "School average",
              comparison: totalMembers && totalMembers > 250 ? "above" : "below"
            }}
          />
          <EnhancedStatsCard
            title="Active Members"
            value={activeMembers || 0}
            icon={<UserCheck className="h-4 w-4" />}
            description={`${membershipRate}% of total members`}
            trend={{
              value: "+8% from last month",
              direction: "up",
              isGood: true
            }}
            helpText="Members who have paid their dues for the current school year. A healthy PTSA typically maintains 60%+ active membership."
            status={getMembershipStatus()}
            benchmark={{
              value: "60%",
              label: "Target rate",
              comparison: parseFloat(membershipRate.toString()) >= 60 ? "above" : "below"
            }}
          />
          <EnhancedStatsCard
            title="Total Revenue"
            value={`$${totalRevenue.toFixed(2)}`}
            icon={<DollarSign className="h-4 w-4" />}
            description={`Avg: $${avgRevenue}/member`}
            trend={{
              value: "+15% from last month",
              direction: "up",
              isGood: true
            }}
            helpText="Total funds collected this month from membership dues, donations, and event tickets. This helps fund PTSA programs and activities."
            status={getRevenueStatus()}
            benchmark={{
              value: "$2,500",
              label: "Monthly goal",
              comparison: totalRevenue >= 2500 ? "above" : "below"
            }}
          />
          <EnhancedStatsCard
            title="Upcoming Events"
            value={upcomingEvents || 0}
            icon={<Calendar className="h-4 w-4" />}
            description="Next 30 days"
            helpText="Number of scheduled events in the next month. A healthy PTSA typically runs 3-5 events per month during the school year."
            status={upcomingEvents && upcomingEvents >= 3 ? "good" : "warning"}
            benchmark={{
              value: "3-5",
              label: "Optimal range",
              comparison: upcomingEvents && upcomingEvents >= 3 && upcomingEvents <= 5 ? "at" : "below"
            }}
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Monthly revenue trends</CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Event Participation</CardTitle>
              <CardDescription>By event type</CardDescription>
            </CardHeader>
            <CardContent>
              <EventAnalytics />
            </CardContent>
          </Card>
        </div>

        {/* Additional Info Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Membership Trends</CardTitle>
              <CardDescription>Growth over time</CardDescription>
            </CardHeader>
            <CardContent>
              <MembershipTrends />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system events</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentActivity 
                payments={recentPayments || []}
                members={recentMembers || []}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Administrative tools</CardDescription>
            </CardHeader>
            <CardContent>
              <QuickActions role="admin" />
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Platform performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm">Database: Healthy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm">Payments: Operational</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm">Auth: Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span className="text-sm">Email: Limited</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}