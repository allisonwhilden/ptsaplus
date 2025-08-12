import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSupabaseServiceClient } from '@/lib/supabase-server'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { PaymentBreakdown } from '@/components/dashboard/PaymentBreakdown'
import { OutstandingDues } from '@/components/dashboard/OutstandingDues'
import { FinancialProjections } from '@/components/dashboard/FinancialProjections'
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Download,
  CreditCard,
  AlertTriangle,
  FileText
} from 'lucide-react'

export default async function TreasurerDashboardPage() {
  const supabase = getSupabaseServiceClient()
  const user = await currentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  // Check if user is treasurer or admin
  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('clerk_id', user.id)
    .single()

  if (!member || !['admin', 'board'].includes(member.role)) {
    redirect('/dashboard')
  }

  // Fetch financial data
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const [
    { data: allPayments },
    { data: membershipPayments },
    { data: donationPayments },
    { data: pendingMembers },
    { data: monthlyRevenue }
  ] = await Promise.all([
    supabase
      .from('payments')
      .select('*')
      .eq('status', 'succeeded')
      .order('created_at', { ascending: false }),
    supabase
      .from('payments')
      .select('*')
      .eq('status', 'succeeded')
      .eq('type', 'membership'),
    supabase
      .from('payments')
      .select('*')
      .eq('status', 'succeeded')
      .eq('type', 'donation'),
    supabase
      .from('members')
      .select('*')
      .eq('membership_status', 'pending'),
    supabase
      .from('payments')
      .select('*')
      .eq('status', 'succeeded')
      .gte('created_at', new Date(currentYear, currentMonth, 1).toISOString())
      .lte('created_at', new Date(currentYear, currentMonth + 1, 0).toISOString())
  ])

  // Calculate totals
  const totalRevenue = allPayments?.reduce((sum, p) => sum + (p.amount / 100), 0) || 0
  const membershipRevenue = membershipPayments?.reduce((sum, p) => sum + (p.amount / 100), 0) || 0
  const donationRevenue = donationPayments?.reduce((sum, p) => sum + (p.amount / 100), 0) || 0
  const monthRevenue = monthlyRevenue?.reduce((sum, p) => sum + (p.amount / 100), 0) || 0
  const outstandingDues = (pendingMembers?.length || 0) * 15 // Assuming $15 base membership

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Treasurer Dashboard</h1>
            <p className="text-muted-foreground">Financial overview and reporting</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Export to CSV
            </Button>
          </div>
        </div>

        {/* Financial Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
          <StatsCard
            title="Total Revenue"
            value={`$${totalRevenue.toFixed(2)}`}
            icon={<DollarSign className="h-4 w-4" />}
            description="All time"
            trend="+23% YoY"
          />
          <StatsCard
            title="This Month"
            value={`$${monthRevenue.toFixed(2)}`}
            icon={<TrendingUp className="h-4 w-4" />}
            description={`${new Date().toLocaleDateString('en-US', { month: 'long' })} revenue`}
          />
          <StatsCard
            title="Membership Dues"
            value={`$${membershipRevenue.toFixed(2)}`}
            icon={<Users className="h-4 w-4" />}
            description="Total collected"
          />
          <StatsCard
            title="Donations"
            value={`$${donationRevenue.toFixed(2)}`}
            icon={<CreditCard className="h-4 w-4" />}
            description="Total received"
          />
          <StatsCard
            title="Outstanding"
            value={`$${outstandingDues.toFixed(2)}`}
            icon={<AlertTriangle className="h-4 w-4" />}
            description="Pending dues"
            trend={pendingMembers?.length + " members"}
            trendColor="text-yellow-600"
          />
        </div>

        {/* Revenue Charts */}
        <div className="grid gap-4 lg:grid-cols-3 mb-8">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Monthly revenue over the past year</CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart detailed />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Payment Breakdown</CardTitle>
              <CardDescription>Revenue by type</CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentBreakdown 
                membershipRevenue={membershipRevenue}
                donationRevenue={donationRevenue}
              />
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tables */}
        <div className="grid gap-4 lg:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Outstanding Dues</CardTitle>
              <CardDescription>Members with pending payments</CardDescription>
            </CardHeader>
            <CardContent>
              <OutstandingDues members={pendingMembers || []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financial Projections</CardTitle>
              <CardDescription>Expected revenue for upcoming months</CardDescription>
            </CardHeader>
            <CardContent>
              <FinancialProjections 
                currentMonthRevenue={monthRevenue}
                activeMembers={membershipPayments?.length || 0}
              />
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest payment activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {allPayments?.slice(0, 10).map((payment) => (
                    <tr key={payment.id} className="border-b">
                      <td className="p-2">{new Date(payment.created_at).toLocaleDateString()}</td>
                      <td className="p-2 capitalize">{payment.type}</td>
                      <td className="p-2">${(payment.amount / 100).toFixed(2)}</td>
                      <td className="p-2">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                          {payment.status}
                        </span>
                      </td>
                      <td className="p-2 font-mono text-xs">{payment.stripe_payment_intent_id.slice(-8)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}