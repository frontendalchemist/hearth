'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  readConsent,
  writeConsent,
  type ConsentState,
} from '@/lib/cookie-consent'
import { CONSENT_ACCEPTED_EVENT } from '@/components/providers/posthog-provider'

interface CookieConsentBannerProps {
  className?: string
  // Test/Storybook-only escape hatch: lets stories render the banner even
  // when localStorage already has a value, and lets unit tests assert the
  // accept/decline handlers without juggling storage state between tests.
  forceVisible?: boolean
}

// Consent only changes through this component's own click handlers — no
// outside writers — so subscribe is a no-op. We still go through
// useSyncExternalStore (rather than a useEffect + setState) so the
// server snapshot is `null` and the client snapshot reads localStorage,
// which keeps hydration consistent without tripping the
// `react-hooks/set-state-in-effect` rule.
const subscribeConsent = () => () => {}
const getServerConsent = () => null

export function CookieConsentBanner({
  className,
  forceVisible = false,
}: CookieConsentBannerProps) {
  const t = useTranslations('cookie')
  const consent = React.useSyncExternalStore(
    subscribeConsent,
    readConsent,
    getServerConsent,
  )
  const [dismissedThisSession, setDismissedThisSession] = React.useState(false)

  const shouldShow =
    forceVisible || (consent === null && !dismissedThisSession)
  if (!shouldShow) return null

  const dismiss = (state: ConsentState) => {
    writeConsent(state)
    if (state === 'accepted' && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CONSENT_ACCEPTED_EVENT))
    }
    setDismissedThisSession(true)
  }

  return (
    <div
      role="region"
      aria-label={t('title')}
      aria-live="polite"
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card text-card-foreground shadow-lg',
        className,
      )}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{t('title')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('body')}</p>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => dismiss('declined')}
          >
            {t('decline')}
          </Button>
          <Button
            type="button"
            size="lg"
            onClick={() => dismiss('accepted')}
          >
            {t('accept')}
          </Button>
        </div>
      </div>
    </div>
  )
}
