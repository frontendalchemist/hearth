// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import messages from '@/messages/en.json'
import { CookieConsentBanner } from './cookie-consent-banner'
import {
  CONSENT_STORAGE_KEY,
  readConsent,
} from '@/lib/cookie-consent'
import { CONSENT_ACCEPTED_EVENT } from '@/components/providers/posthog-provider'

function renderBanner(props?: { forceVisible?: boolean }) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CookieConsentBanner {...props} />
    </NextIntlClientProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  // Vitest doesn't enable @testing-library/react's auto-cleanup unless
  // `globals: true` is set in the config — without this the previous
  // test's DOM tree leaks into the next render and screen queries find
  // duplicates of the same element.
  cleanup()
  window.localStorage.clear()
})

describe('CookieConsentBanner', () => {
  it('renders the banner when no consent has been recorded', async () => {
    renderBanner()
    expect(await screen.findByRole('region')).toBeInTheDocument()
    expect(screen.getByText(messages.cookie.title)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: messages.cookie.accept }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: messages.cookie.decline }),
    ).toBeInTheDocument()
  })

  it('renders nothing when consent is already recorded', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted')
    renderBanner()
    expect(screen.queryByRole('region')).not.toBeInTheDocument()
  })

  it('persists "accepted", dispatches the accept event, and hides the banner on Accept', async () => {
    const user = userEvent.setup()
    let dispatched = false
    const onAccept = () => {
      dispatched = true
    }
    window.addEventListener(CONSENT_ACCEPTED_EVENT, onAccept)

    try {
      renderBanner()
      await user.click(
        await screen.findByRole('button', { name: messages.cookie.accept }),
      )

      expect(readConsent()).toBe('accepted')
      expect(dispatched).toBe(true)
      expect(screen.queryByRole('region')).not.toBeInTheDocument()
    } finally {
      window.removeEventListener(CONSENT_ACCEPTED_EVENT, onAccept)
    }
  })

  it('persists "declined" and does NOT dispatch the accept event on Decline', async () => {
    const user = userEvent.setup()
    let dispatched = false
    const onAccept = () => {
      dispatched = true
    }
    window.addEventListener(CONSENT_ACCEPTED_EVENT, onAccept)

    try {
      renderBanner()
      await user.click(
        await screen.findByRole('button', { name: messages.cookie.decline }),
      )

      expect(readConsent()).toBe('declined')
      expect(dispatched).toBe(false)
      expect(screen.queryByRole('region')).not.toBeInTheDocument()
    } finally {
      window.removeEventListener(CONSENT_ACCEPTED_EVENT, onAccept)
    }
  })

  it('honors `forceVisible` so Storybook can preview the banner regardless of stored state', async () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted')
    renderBanner({ forceVisible: true })
    expect(await screen.findByRole('region')).toBeInTheDocument()
  })

  it('uses an aria-live region so screen readers announce it', async () => {
    renderBanner()
    const region = await screen.findByRole('region')
    expect(region).toHaveAttribute('aria-live', 'polite')
    expect(region).toHaveAttribute('aria-label', messages.cookie.title)
  })
})
