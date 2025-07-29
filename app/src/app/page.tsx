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
            Welcome to Our PTSA
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Supporting our school community through parent engagement, 
            volunteer coordination, and fundraising initiatives.
          </p>
          
          <div className="flex gap-4 justify-center">
            <SignedIn>
              <Link href="/dashboard">
                <Button size="lg">Go to Dashboard</Button>
              </Link>
            </SignedIn>
            
            <SignedOut>
              <SignInButton mode="modal">
                <Button size="lg">Join Our PTSA</Button>
              </SignInButton>
              <Link href="/events">
                <Button size="lg" variant="outline">View Events</Button>
              </Link>
            </SignedOut>
          </div>
        </div>
      </section>
      
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Get Involved
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Become a Member</CardTitle>
                <CardDescription>
                  Join our PTSA and make a difference in our school
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✓ Support school programs</li>
                  <li>✓ Vote on important decisions</li>
                  <li>✓ Access member benefits</li>
                  <li>✓ Connect with other parents</li>
                </ul>
                <div className="mt-4">
                  <p className="font-semibold">Annual Dues:</p>
                  <p>Individual: $15</p>
                  <p>Family: $25</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Volunteer</CardTitle>
                <CardDescription>
                  Help make our events and programs successful
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✓ Event support</li>
                  <li>✓ Fundraising activities</li>
                  <li>✓ Committee participation</li>
                  <li>✓ Flexible time commitment</li>
                </ul>
                <div className="mt-4">
                  <Link href="/events">
                    <Button variant="outline" size="sm" className="w-full">
                      View Volunteer Opportunities
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Stay Connected</CardTitle>
                <CardDescription>
                  Keep up with PTSA news and activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✓ Monthly newsletters</li>
                  <li>✓ Event announcements</li>
                  <li>✓ Important updates</li>
                  <li>✓ School news</li>
                </ul>
                <div className="mt-4">
                  <SignInButton mode="modal">
                    <Button variant="outline" size="sm" className="w-full">
                      Sign Up for Updates
                    </Button>
                  </SignInButton>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Our Impact This Year
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Together, we're making a difference in our school community
          </p>
          
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">450+</div>
              <div className="text-muted-foreground">Member Families</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">$75K</div>
              <div className="text-muted-foreground">Raised for School</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">2,500+</div>
              <div className="text-muted-foreground">Volunteer Hours</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">25+</div>
              <div className="text-muted-foreground">Events Hosted</div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}