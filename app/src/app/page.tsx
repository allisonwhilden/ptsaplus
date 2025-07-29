import Link from 'next/link'
import { SignInButton, SignedIn, SignedOut } from '@clerk/nextjs'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <MainLayout>
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-6">
            Modern PTSA Management Made Simple
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Streamline your Parent-Teacher-Student Association operations with our 
            all-in-one platform designed for busy volunteers.
          </p>
          
          <div className="flex gap-4 justify-center">
            <SignedIn>
              <Link href="/dashboard">
                <Button size="lg">Go to Dashboard</Button>
              </Link>
            </SignedIn>
            
            <SignedOut>
              <SignInButton mode="modal">
                <Button size="lg">Get Started Free</Button>
              </SignInButton>
              <Link href="/demo">
                <Button size="lg" variant="outline">Watch Demo</Button>
              </Link>
            </SignedOut>
          </div>
        </div>
      </section>
      
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything Your PTSA Needs
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Membership Management</CardTitle>
                <CardDescription>
                  Track members, collect dues, and manage roles effortlessly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✓ Online membership signup</li>
                  <li>✓ Automated payment processing</li>
                  <li>✓ Member directory</li>
                  <li>✓ Role-based access control</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Event Planning</CardTitle>
                <CardDescription>
                  Organize events, sell tickets, and track attendance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✓ Event calendar</li>
                  <li>✓ Online ticket sales</li>
                  <li>✓ Volunteer signup sheets</li>
                  <li>✓ Automated reminders</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Financial Tools</CardTitle>
                <CardDescription>
                  Manage finances with transparency and ease
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✓ Online payment collection</li>
                  <li>✓ Financial reporting</li>
                  <li>✓ Budget tracking</li>
                  <li>✓ Donation management</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Trusted by PTSAs Nationwide
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of PTSAs using our platform to save time and increase engagement
          </p>
          
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-muted-foreground">Active Members</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-muted-foreground">PTSAs</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">$2M+</div>
              <div className="text-muted-foreground">Processed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-muted-foreground">Uptime</div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}