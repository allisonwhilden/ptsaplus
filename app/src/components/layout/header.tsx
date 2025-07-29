'use client'

import Link from 'next/link'
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          Our PTSA
        </Link>
        
        <nav className="flex items-center gap-6">
          <SignedIn>
            <Link href="/dashboard" className="text-sm font-medium hover:text-primary">
              Dashboard
            </Link>
            <Link href="/members" className="text-sm font-medium hover:text-primary">
              Members
            </Link>
            <Link href="/events" className="text-sm font-medium hover:text-primary">
              Events
            </Link>
            <Link href="/committees" className="text-sm font-medium hover:text-primary">
              Committees
            </Link>
            <Link href="/settings/roles" className="text-sm font-medium hover:text-primary">
              Settings
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          
          <SignedOut>
            <Link href="/about" className="text-sm font-medium hover:text-primary">
              About
            </Link>
            <Link href="/events" className="text-sm font-medium hover:text-primary">
              Events
            </Link>
            <Link href="/contact" className="text-sm font-medium hover:text-primary">
              Contact
            </Link>
            <SignInButton mode="modal">
              <Button>Member Login</Button>
            </SignInButton>
          </SignedOut>
        </nav>
      </div>
    </header>
  )
}