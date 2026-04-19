'use client'

import { useEffect } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import { initAnalytics, identifyUser } from '@/lib/analytics'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser()

  useEffect(() => {
    initAnalytics()
  }, [])

  useEffect(() => {
    if (user?.sub) {
      identifyUser(user.sub)
    }
  }, [user?.sub])

  return <>{children}</>
}
