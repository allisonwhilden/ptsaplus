import { currentUser } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MemberEditForm } from '@/components/forms/member-edit-form'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function EditMemberPage({
  params,
}: {
  params: { id: string }
}) {
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

  // Only admins can edit members
  if (!isAdmin) {
    redirect('/members')
  }

  // Get member details
  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!member) {
    notFound()
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Edit Member</CardTitle>
            <CardDescription>
              Update member information for {member.first_name} {member.last_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MemberEditForm member={member} />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}