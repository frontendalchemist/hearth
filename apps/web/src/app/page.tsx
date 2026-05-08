import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { auth0 } from '@/lib/auth0'

export default async function HomePage() {
  const session = await auth0.getSession()

  if (session) {
    redirect('/dashboard' as Route)
  } else {
    redirect('/login' as Route)
  }
}
