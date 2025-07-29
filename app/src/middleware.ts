import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Protected routes requiring authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/members(.*)',
  '/events(.*)',
  '/committees(.*)',
  '/documents(.*)',
  '/settings(.*)',
  '/api/admin(.*)',
  '/register(.*)',
  '/payments(.*)',
  '/api/members(.*)',
])

// Public routes accessible without authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/about',
  '/contact',
  '/events', // List view only
  '/api/public(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}