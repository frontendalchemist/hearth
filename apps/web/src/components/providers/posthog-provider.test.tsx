// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'

// Mock the analytics module so we can assert that PostHog only initializes
// when the user has accepted cookies. The real module pulls in posthog-js,
// which would call into the network on init.
vi.mock('@/lib/analytics', () => ({
  initAnalytics: vi.fn(),
}))

import { initAnalytics } from '@/lib/analytics'
import { CONSENT_STORAGE_KEY } from '@/lib/cookie-consent'
import {
  CONSENT_ACCEPTED_EVENT,
  PostHogProvider,
} from './posthog-provider'

const initSpy = vi.mocked(initAnalytics)

beforeEach(() => {
  initSpy.mockReset()
  window.localStorage.clear()
})

afterEach(() => {
  // Unmount before clearing storage so the provider's window event listener
  // is detached — otherwise a stale listener from the previous render hears
  // the next test's dispatched event and inflates the spy call count.
  cleanup()
  window.localStorage.clear()
})

describe('PostHogProvider', () => {
  it('does NOT initialize analytics when consent is unrecorded', () => {
    render(
      <PostHogProvider>
        <span />
      </PostHogProvider>,
    )
    expect(initSpy).not.toHaveBeenCalled()
  })

  it('does NOT initialize analytics when the user declined', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'declined')
    render(
      <PostHogProvider>
        <span />
      </PostHogProvider>,
    )
    expect(initSpy).not.toHaveBeenCalled()
  })

  it('initializes analytics on mount when consent is already "accepted"', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted')
    render(
      <PostHogProvider>
        <span />
      </PostHogProvider>,
    )
    expect(initSpy).toHaveBeenCalledOnce()
  })

  it('initializes analytics when the banner dispatches the accept event mid-session', () => {
    render(
      <PostHogProvider>
        <span />
      </PostHogProvider>,
    )
    expect(initSpy).not.toHaveBeenCalled()

    window.dispatchEvent(new CustomEvent(CONSENT_ACCEPTED_EVENT))
    expect(initSpy).toHaveBeenCalledOnce()
  })
})
