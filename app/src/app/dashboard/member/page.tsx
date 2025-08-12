import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSupabaseServiceClient } from '@/lib/supabase-server'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar,
  CreditCard,
  Heart,
  Users,
  Clock,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

export default async function MemberDashboardPage() {
  const supabase = getSupabaseServiceClient()
  const user = await currentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  // Get member data
  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('clerk_id', user.id)
    .single()

  if (!member) {
    redirect('/register')
  }

  // Fetch member-specific data
  const [
    { data: myPayments },
    { data: myRsvps },
    { data: myVolunteerSignups },
    { data: upcomingEvents }
  ] = await Promise.all([
    supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('event_rsvps')
      .select(`
        *,
        events (
          id,
          title,
          start_time,
          end_time,
          location_type,
          location_details
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'attending'),
    supabase
      .from('event_volunteer_signups')
      .select(`
        *,
        event_volunteer_slots (
          title,
          description,
          events (
            title,
            start_time,
            end_time
          )
        )
      `)
      .eq('user_id', user.id),
    supabase
      .from('events')
      .select('*')
      .gte('start_time', new Date().toISOString())
      .in('visibility', ['public', 'members'])
      .order('start_time', { ascending: true })
      .limit(5)
  ])

  // Calculate volunteer hours (estimated)
  const volunteerHours = (myVolunteerSignups?.length || 0) * 2 // Assuming 2 hours per signup

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome back, {member.first_name}!</h1>
          <p className="text-muted-foreground">Your personal PTSA dashboard</p>
        </div>

        {/* Member Status Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Membership Status</CardTitle>
            <CardDescription>Your current membership information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Membership Type</p>
                <p className="font-medium capitalize">{member.membership_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={member.membership_status === 'active' ? 'default' : 'secondary'}>
                  {member.membership_status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">{new Date(member.joined_at).toLocaleDateString()}</p>
              </div>
              {member.membership_expires_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Expires</p>
                  <p className="font-medium">{new Date(member.membership_expires_at).toLocaleDateString()}</p>
                </div>
              )}
            </div>
            {member.membership_status !== 'active' && (
              <div className="mt-4">
                <Button asChild>
                  <Link href="/membership/pay">Renew Membership</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{myRsvps?.length || 0}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">You're attending</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Volunteer Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{volunteerHours}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">This school year</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Contributions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  ${myPayments?.reduce((sum, p) => sum + (p.amount / 100), 0).toFixed(0) || 0}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total donated</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Volunteer Slots</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{myVolunteerSignups?.length || 0}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Signed up for</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* My Events */}
          <Card>
            <CardHeader>
              <CardTitle>My Upcoming Events</CardTitle>
              <CardDescription>Events you've RSVP'd to attend</CardDescription>
            </CardHeader>
            <CardContent>
              {myRsvps && myRsvps.length > 0 ? (
                <div className="space-y-4">
                  {myRsvps.map((rsvp) => (
                    <div key={rsvp.id} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">{rsvp.events?.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(rsvp.events?.start_time).toLocaleDateString()} at{' '}
                          {new Date(rsvp.events?.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {rsvp.guest_count > 0 && (
                          <p className="text-sm text-muted-foreground">+{rsvp.guest_count} guests</p>
                        )}
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/events/${rsvp.events?.id}`}>View</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No upcoming events. Browse events to RSVP!</p>
              )}
              <Button className="w-full mt-4" variant="outline" asChild>
                <Link href="/events">Browse All Events</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Your recent transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {myPayments && myPayments.length > 0 ? (
                <div className="space-y-3">
                  {myPayments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium capitalize">{payment.type}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${(payment.amount / 100).toFixed(2)}</p>
                        <Badge variant="outline" className="text-xs">
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No payment history yet.</p>
              )}
              <Button className="w-full mt-4" variant="outline" asChild>
                <Link href="/payments/history">View All Transactions</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Volunteer Commitments */}
          <Card>
            <CardHeader>
              <CardTitle>My Volunteer Commitments</CardTitle>
              <CardDescription>Upcoming volunteer activities</CardDescription>
            </CardHeader>
            <CardContent>
              {myVolunteerSignups && myVolunteerSignups.length > 0 ? (
                <div className="space-y-4">
                  {myVolunteerSignups.map((signup) => (
                    <div key={signup.id} className="border-l-2 border-primary pl-3">
                      <p className="font-medium">{signup.event_volunteer_slots?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {signup.event_volunteer_slots?.events?.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(signup.event_volunteer_slots?.events?.start_time).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No volunteer commitments yet.</p>
              )}
              <Button className="w-full mt-4" variant="outline" asChild>
                <Link href="/volunteer">Find Volunteer Opportunities</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/members">
                    <Users className="mr-2 h-4 w-4" />
                    View Member Directory
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/events/calendar">
                    <Calendar className="mr-2 h-4 w-4" />
                    Event Calendar
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/donate">
                    <Heart className="mr-2 h-4 w-4" />
                    Make a Donation
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/profile">
                    <Users className="mr-2 h-4 w-4" />
                    Update Profile
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}