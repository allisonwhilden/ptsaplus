import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function DashboardPage() {
  const user = await currentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  // Check if user is registered as a member
  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // If not a member, redirect to registration
  if (!member) {
    redirect('/register')
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Welcome, {member.first_name}!</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Membership Status</CardTitle>
              <CardDescription>Your current membership information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Type:</strong> {member.membership_type}</p>
                <p><strong>Status:</strong> <span className={member.membership_status === 'active' ? 'text-green-600' : 'text-yellow-600'}>{member.membership_status}</span></p>
                {member.membership_expires_at && (
                  <p><strong>Expires:</strong> {new Date(member.membership_expires_at).toLocaleDateString()}</p>
                )}
              </div>
              {member.membership_status === 'pending' && (
                <Button className="mt-4" asChild>
                  <Link href="/payments/membership">Complete Payment</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/events">View Upcoming Events</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/volunteer">Volunteer Opportunities</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/donate">Make a Donation</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Announcements</CardTitle>
              <CardDescription>Stay up to date with PTSA news</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No new announcements</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/announcements">View All</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {member.volunteer_interests && member.volunteer_interests.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Volunteer Dashboard</CardTitle>
              <CardDescription>Track your volunteer activities</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Thank you for your interest in volunteering! We'll contact you about upcoming opportunities.</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/volunteer/dashboard">View Volunteer Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}