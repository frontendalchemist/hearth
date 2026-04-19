import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge'

// Protect all dashboard routes — redirect to /login if not authenticated.
// Auth0 SDK handles the redirect automatically.
export default withMiddlewareAuthRequired()

export const config = {
  matcher: [
    '/vault/:path*',
    '/health-hub/:path*',
    '/ai-assistant/:path*',
    '/stage-navigator/:path*',
    '/workspace/:path*',
  ],
}
