import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { auth0 } from '@/lib/auth0'

export default async function HomePage() {
  // Dev-only bypass mirrors requireAuth() — skip the Auth0 session check so the
  // root route lands on the dashboard. NODE_ENV guard keeps it dead in prod.
  const devAuthBypass =
    process.env.NODE_ENV !== 'production' &&
    process.env.DEV_AUTH_BYPASS === 'true'

  if (devAuthBypass) {
    redirect('/dashboard' as Route)
  }

  const session = await auth0.getSession()

  if (session) {
    redirect('/dashboard' as Route)
  } else {
    redirect('/login' as Route)
  }
}
