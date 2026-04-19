import { redirect } from 'next/navigation'
import { getSession } from '@auth0/nextjs-auth0'

export default async function HomePage() {
  const session = await getSession()

  if (session) {
    redirect('/vault')
  } else {
    redirect('/login')
  }
}
