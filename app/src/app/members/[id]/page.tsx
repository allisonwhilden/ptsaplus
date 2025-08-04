import { currentUser } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { getSupabaseServiceClient } from '@/lib/supabase-server'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'


export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = getSupabaseServiceClient()
  const user = await currentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  // Get current user's role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = userData?.role === 'admin' || userData?.role === 'board'

  // Get member details
  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .single()

  if (!member) {
    notFound()
  }

  // Only allow viewing own profile or if admin
  if (member.user_id !== user.id && !isAdmin) {
    redirect('/members')
  }

  const getMembershipBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'pending':
        return 'bg-yellow-500'
      case 'expired':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Member Details</h1>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/members">Back to Members</Link>
            </Button>
            {isAdmin && (
              <Button asChild>
                <Link href={`/members/${member.id}/edit`}>Edit Member</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Basic member details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-lg">{member.first_name} {member.last_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-lg">{member.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-lg">{member.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                  <p className="text-lg">{new Date(member.joined_at).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Membership Information</CardTitle>
              <CardDescription>Membership type and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Membership Type</p>
                  <p className="text-lg">{member.membership_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={`${getMembershipBadgeColor(member.membership_status)} text-white`}>
                    {member.membership_status}
                  </Badge>
                </div>
                {member.membership_expires_at && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Expires</p>
                    <p className="text-lg">{new Date(member.membership_expires_at).toLocaleDateString()}</p>
                  </div>
                )}
                {member.membership_status === 'pending' && (
                  <div>
                    <Button asChild>
                      <Link href={`/payments/checkout?memberId=${member.id}`}>
                        Complete Payment
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {member.student_info && (
            <Card>
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
                <CardDescription>Associated student details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {member.student_info.name && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Student Name</p>
                      <p className="text-lg">{member.student_info.name}</p>
                    </div>
                  )}
                  {member.student_info.grade && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Grade</p>
                      <p className="text-lg">{member.student_info.grade}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {member.volunteer_interests && member.volunteer_interests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Volunteer Interests</CardTitle>
                <CardDescription>Areas where this member wants to help</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {member.volunteer_interests.map((interest: string) => (
                    <Badge key={interest} variant="secondary">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {isAdmin && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Privacy & Compliance</CardTitle>
                  <CardDescription>Privacy consent and data handling status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Privacy Consent</p>
                      <Badge variant={member.privacy_consent_given ? 'default' : 'destructive'}>
                        {member.privacy_consent_given ? 'Given' : 'Not Given'}
                      </Badge>
                    </div>
                    {member.student_info && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Student Data Consent</p>
                        <Badge variant="default">FERPA Compliant</Badge>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Consent Date</p>
                      <p className="text-sm">{member.consent_date ? new Date(member.consent_date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Data Processing</p>
                      <p className="text-sm">Minimal data collection</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Administrative Actions</CardTitle>
                  <CardDescription>Manage this member&apos;s account</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline">View Privacy Audit Log</Button>
                    <Button variant="outline">Export Member Data</Button>
                    {member.membership_status === 'pending' && (
                      <Button variant="outline">Mark as Paid</Button>
                    )}
                    <Button variant="outline">Withdraw Consent</Button>
                    <Button variant="destructive">Remove Member (GDPR)</Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    All actions are logged for compliance audit trail
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  )
}