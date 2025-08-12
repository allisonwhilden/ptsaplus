import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSupabaseServiceClient } from '@/lib/supabase-server'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TreasurerStatsCard } from '@/components/dashboard/TreasurerStatsCard'
import { FinancialHealthSummary } from '@/components/dashboard/FinancialHealthSummary'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { PaymentBreakdown } from '@/components/dashboard/PaymentBreakdown'
import { OutstandingDues } from '@/components/dashboard/OutstandingDues'
import { FinancialProjections } from '@/components/dashboard/FinancialProjections'
import { 
  DollarSign, 
  TrendingUp, 
  Download,
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
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">PTSA Money Dashboard</h1>
            <p className="text-muted-foreground">Everything you need to know about our finances</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto">
              <FileText className="mr-2 h-4 w-4" />
              Create Report
            </Button>
            <Button className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Download Data
            </Button>
          </div>
        </div>

        {/* Financial Health Overview */}
        <FinancialHealthSummary 
          totalRevenue={totalRevenue}
          monthlyRevenue={monthRevenue}
          outstandingDues={outstandingDues}
          pendingMembersCount={pendingMembers?.length || 0}
          membershipRevenue={membershipRevenue}
          donationRevenue={donationRevenue}
        />

        {/* Key Financial Numbers */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-6 sm:mb-8">
          <TreasurerStatsCard
            title="Total Revenue"
            plainLanguageTitle="Total Money Raised"
            value={`$${totalRevenue.toFixed(2)}`}
            icon={<DollarSign className="h-4 w-4" />}
            description="All time"
            helpText="This is all the money we've collected since the beginning - membership fees, donations, and fundraising combined."
            healthStatus={totalRevenue > 1000 ? 'good' : totalRevenue > 500 ? 'warning' : 'alert'}
            trend={{
              direction: 'up',
              percentage: '+23% vs last year',
              isGood: true
            }}
          />
          
          <TreasurerStatsCard
            title="This Month"
            plainLanguageTitle="Money This Month"
            value={`$${monthRevenue.toFixed(2)}`}
            icon={<TrendingUp className="h-4 w-4" />}
            description={`${new Date().toLocaleDateString('en-US', { month: 'long' })} income`}
            helpText="This shows how much money came in this month from all sources. This helps track if we're meeting our monthly goals."
            healthStatus={monthRevenue > 400 ? 'good' : monthRevenue > 200 ? 'warning' : 'alert'}
          />
          
          <TreasurerStatsCard
            title="Outstanding"
            plainLanguageTitle="Money We're Owed"
            value={`$${outstandingDues.toFixed(2)}`}
            icon={<AlertTriangle className="h-4 w-4" />}
            description={`${pendingMembers?.length || 0} families haven't paid`}
            helpText="This is money from families who signed up but haven't paid their membership fees yet. It's normal to have some pending payments."
            healthStatus={outstandingDues < 300 ? 'good' : outstandingDues < 600 ? 'warning' : 'alert'}
            actionable={outstandingDues > 300 ? {
              action: 'Send payment reminders',
              description: 'Consider following up with families who haven\'t paid yet'
            } : undefined}
          />
        </div>

        {/* Money Trends and Breakdown */}
        <div className="grid gap-4 lg:grid-cols-3 mb-6 sm:mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>How Our Income Changes Over Time</CardTitle>
              <CardDescription>Monthly income for the past year - helps spot trends</CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart detailed />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Where Our Money Comes From</CardTitle>
              <CardDescription>Breakdown by membership fees vs donations</CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentBreakdown 
                membershipRevenue={membershipRevenue}
                donationRevenue={donationRevenue}
              />
            </CardContent>
          </Card>
        </div>

        {/* Action Items and Future Planning */}
        <div className="grid gap-4 lg:grid-cols-2 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-6">
              <OutstandingDues members={pendingMembers || []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What to Expect Next</CardTitle>
              <CardDescription>Estimated income for the next few months</CardDescription>
            </CardHeader>
            <CardContent>
              <FinancialProjections 
                currentMonthRevenue={monthRevenue}
                activeMembers={membershipPayments?.length || 0}
              />
            </CardContent>
          </Card>
        </div>

        {/* Recent Payment Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Latest money that came in - most recent first</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {allPayments && allPayments.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">When</th>
                      <th className="text-left p-3">What For</th>
                      <th className="text-left p-3">Amount</th>
                      <th className="text-left p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPayments.slice(0, 10).map((payment) => (
                      <tr key={payment.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-3">{new Date(payment.created_at).toLocaleDateString()}</td>
                        <td className="p-3">
                          {payment.type === 'membership' ? 'Membership Fee' : 
                           payment.type === 'donation' ? 'Donation' : 
                           payment.type}
                        </td>
                        <td className="p-3 font-medium text-green-600">${(payment.amount / 100).toFixed(2)}</td>
                        <td className="p-3">
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                            Completed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No payments yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Payments will show up here when families start paying their dues
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}