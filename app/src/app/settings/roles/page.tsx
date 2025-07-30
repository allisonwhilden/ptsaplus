import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSupabaseServiceClient } from '@/lib/supabase-server'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RoleAssignmentForm } from '@/components/forms/role-assignment-form'
import { User, UserRole } from '@/types/database'


export default async function RolesPage() {
  const supabase = getSupabaseServiceClient()
  const user = await currentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Get all users with their member information
  const { data: users } = await supabase
    .from('users')
    .select(`
      id,
      email,
      first_name,
      last_name,
      role,
      created_at,
      members (
        id,
        membership_status
      )
    `)
    .order('created_at', { ascending: false })

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500'
      case 'board':
        return 'bg-purple-500'
      case 'committee_chair':
        return 'bg-blue-500'
      case 'teacher':
        return 'bg-green-500'
      case 'member':
      default:
        return 'bg-gray-500'
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Administrator'
      case 'board':
        return 'Board Member'
      case 'committee_chair':
        return 'Committee Chair'
      case 'teacher':
        return 'Teacher/Staff'
      case 'member':
      default:
        return 'Member'
    }
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Role Management</h1>
          <p className="text-muted-foreground">
            Assign and manage user roles for your PTSA
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Overview</CardTitle>
              <CardDescription>
                Different roles have different permissions in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <h4 className="font-semibold mb-2">Administrator</h4>
                  <p className="text-sm text-muted-foreground">
                    Full system access, can manage all aspects of the PTSA
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Board Member</h4>
                  <p className="text-sm text-muted-foreground">
                    Can manage members, events, and view financial reports
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Committee Chair</h4>
                  <p className="text-sm text-muted-foreground">
                    Can manage their committee and related events
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Teacher/Staff</h4>
                  <p className="text-sm text-muted-foreground">
                    Free membership, can view events and resources
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Member</h4>
                  <p className="text-sm text-muted-foreground">
                    Basic access to member features and events
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Roles</CardTitle>
              <CardDescription>
                Assign roles to users to grant them appropriate permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Current Role</TableHead>
                      <TableHead>Member Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={`${getRoleBadgeColor(user.role)} text-white`}>
                            {getRoleLabel(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.members?.[0]?.membership_status || 'Not registered'}
                        </TableCell>
                        <TableCell>
                          <RoleAssignmentForm 
                            userId={user.id} 
                            currentRole={user.role}
                            userName={`${user.first_name} ${user.last_name}`}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}