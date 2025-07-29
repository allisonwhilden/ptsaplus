import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold mb-3">Our PTSA</h3>
            <p className="text-sm text-muted-foreground">
              Supporting our school community since 1985
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              501(c)(3) Non-Profit Organization
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-primary">About Us</Link></li>
              <li><Link href="/members" className="hover:text-primary">Membership</Link></li>
              <li><Link href="/events" className="hover:text-primary">Events</Link></li>
              <li><Link href="/committees" className="hover:text-primary">Committees</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/documents" className="hover:text-primary">Documents</Link></li>
              <li><Link href="/volunteer" className="hover:text-primary">Volunteer</Link></li>
              <li><Link href="/donate" className="hover:text-primary">Donate</Link></li>
              <li><Link href="/contact" className="hover:text-primary">Contact Us</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Contact</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Email: info@ourptsa.org</p>
              <p>Phone: (555) 123-4567</p>
              <p>Our School Name</p>
              <p>123 School Street</p>
              <p>City, State 12345</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Our PTSA. All rights reserved.</p>
          <p className="mt-2">
            <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
            {' • '}
            <Link href="/terms" className="hover:text-primary">Terms of Use</Link>
          </p>
        </div>
      </div>
    </footer>
  )
}