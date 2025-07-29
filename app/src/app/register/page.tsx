import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { RegistrationForm } from '@/components/forms/registration-form'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function RegisterPage() {
  const user = await currentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  // Check if user is already registered as a member
  // This would be a database check in production
  // For now, we'll proceed with registration

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Complete Your PTSA Membership</CardTitle>
            <CardDescription>
              Welcome! Please complete your registration to become a member of our PTSA.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegistrationForm userId={user.id} />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}