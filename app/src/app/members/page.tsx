import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSupabaseServiceClient } from '@/lib/supabase-server'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>
}) {
  const params = await searchParams;
  const supabase = getSupabaseServiceClient()
  const user = await currentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  // Check if user is a member and has admin/board role
  const { data: currentMember } = await supabase
    .from('members')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!currentMember) {
    redirect('/register')
  }

  // Get user role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = userData?.role === 'admin' || userData?.role === 'board'

  // Build query with data minimization - only select necessary fields
  let query = supabase
    .from('members')
    .select([
      'id',
      'first_name',
      'last_name',
      ...(isAdmin ? ['email'] : []),
      'membership_type',
      'membership_status',
      'joined_at',
      ...(isAdmin ? ['phone', 'student_info', 'privacy_consent_given'] : []),
      'deleted_at'
    ].join(','))
    .is('deleted_at', null) // Only show non-deleted members
    .order('joined_at', { ascending: false })

  // Apply search filter
  if (params.search) {
    query = query.or(
      `first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,email.ilike.%${params.search}%`
    )
  }

  // Apply status filter
  if (params.status) {
    query = query.eq('membership_status', params.status)
  }

  const result = await query

  // Check if the query failed or returned an error
  if (result.error || !result.data || !Array.isArray(result.data)) {
    console.error('Error fetching members:', result.error)
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                Error loading members. Please try again later.
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  // Now we know result.data is a valid array
  const members = result.data;

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

  const getMembershipTypeLabel = (type: string) => {
    switch (type) {
      case 'individual':
        return 'Individual'
      case 'family':
        return 'Family'
      case 'teacher':
        return 'Teacher/Staff'
      default:
        return type
    }
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Members</h1>
            <p className="text-muted-foreground">
              {members.length} total members
            </p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/members/export">Export List</Link>
              </Button>
              <Button asChild>
                <Link href="/members/invite">Invite Members</Link>
              </Button>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Member Directory</CardTitle>
            <CardDescription>
              View and manage PTSA members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-4">
              <form className="flex-1">
                <Input
                  placeholder="Search by name or email..."
                  name="search"
                  defaultValue={params.search}
                />
              </form>
              <form>
                <select
                  name="status"
                  defaultValue={params.status}
                  className="h-10 px-3 border border-input bg-background rounded-md"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                </select>
                <Button type="submit" variant="outline" className="ml-2">
                  Filter
                </Button>
              </form>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    {isAdmin && <TableHead>Email</TableHead>}
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    {isAdmin && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member: any) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.first_name} {member.last_name}
                      </TableCell>
                      {isAdmin && <TableCell>{member.email}</TableCell>}
                      <TableCell>
                        {getMembershipTypeLabel(member.membership_type)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getMembershipBadgeColor(member.membership_status)}>
                          {member.membership_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(member.joined_at).toLocaleDateString()}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/members/${member.id}`}>View</Link>
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {members.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No members found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}