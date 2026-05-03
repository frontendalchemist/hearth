'use client'

import { useEffect } from 'react'
import { initAnalytics } from '@/lib/analytics'
import { readConsent } from '@/lib/cookie-consent'

// Listen for the banner's accept event so analytics can spin up mid-session
// without a page reload. The banner dispatches this on the window after it
// writes the consent flag.
export const CONSENT_ACCEPTED_EVENT = 'hearth:cookie-consent-accepted'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (readConsent() === 'accepted') initAnalytics()

    const onAccept = () => initAnalytics()
    window.addEventListener(CONSENT_ACCEPTED_EVENT, onAccept)
    return () => window.removeEventListener(CONSENT_ACCEPTED_EVENT, onAccept)
  }, [])

  return <>{children}</>
}
