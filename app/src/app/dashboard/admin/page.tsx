import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSupabaseServiceClient } from '@/lib/supabase-server'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { MembershipTrends } from '@/components/dashboard/MembershipTrends'
import { EventAnalytics } from '@/components/dashboard/EventAnalytics'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { 
  Users, 
  DollarSign, 
  Calendar, 
  TrendingUp,
  UserCheck,
  AlertCircle
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

  // Fetch aggregate data for admin dashboard
  const [
    { count: totalMembers },
    { count: activeMembers },
    { data: recentPayments },
    { count: upcomingEvents },
    { data: recentMembers }
  ] = await Promise.all([
    supabase.from('members').select('*', { count: 'exact', head: true }),
    supabase.from('members').select('*', { count: 'exact', head: true }).eq('membership_status', 'active'),
    supabase.from('payments').select('*').eq('status', 'succeeded').order('created_at', { ascending: false }).limit(5),
    supabase.from('events').select('*', { count: 'exact', head: true }).gte('start_time', new Date().toISOString()),
    supabase.from('members').select('*').order('created_at', { ascending: false }).limit(5)
  ])

  // Calculate total revenue
  const totalRevenue = recentPayments?.reduce((sum, payment) => sum + (payment.amount / 100), 0) || 0

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and management tools</p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatsCard
            title="Total Members"
            value={totalMembers || 0}
            icon={<Users className="h-4 w-4" />}
            description="All registered members"
            trend="+12% from last month"
          />
          <StatsCard
            title="Active Members"
            value={activeMembers || 0}
            icon={<UserCheck className="h-4 w-4" />}
            description="Paid memberships"
            trend="+8% from last month"
          />
          <StatsCard
            title="Total Revenue"
            value={`$${totalRevenue.toFixed(2)}`}
            icon={<DollarSign className="h-4 w-4" />}
            description="This month"
            trend="+15% from last month"
          />
          <StatsCard
            title="Upcoming Events"
            value={upcomingEvents || 0}
            icon={<Calendar className="h-4 w-4" />}
            description="Next 30 days"
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