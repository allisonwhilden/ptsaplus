import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSupabaseServiceClient } from '@/lib/supabase-server'

export default async function DashboardPage() {
  const supabase = getSupabaseServiceClient()
  const user = await currentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  // Check if user is registered as a member
  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('clerk_id', user.id)
    .single()

  // If not a member, redirect to registration
  if (!member) {
    redirect('/register')
  }

  // Route to appropriate dashboard based on role
  switch (member.role) {
    case 'admin':
      redirect('/dashboard/admin')
    case 'board':
      redirect('/dashboard/board')
    case 'committee_chair':
      redirect('/dashboard/board')
    default:
      redirect('/dashboard/member')
  }
}