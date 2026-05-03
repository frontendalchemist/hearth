// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// posthog-js is mocked module-wide. We don't run the real SDK in tests —
// we only verify that *if* the key is set, our wrapper calls init with the
// HIPAA-required masking flags.
vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
  },
}))

import posthog from 'posthog-js'
import { identifyUser, resetAnalytics, track } from './analytics'
// initAnalytics is intentionally not imported here — every test in the
// `initAnalytics` block uses `vi.resetModules()` and re-imports it
// dynamically so the module-level `initialized` flag starts fresh.

describe('initAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // The module caches "did we init yet" in a closure. Reload the module
    // between tests so each test exercises a fresh init.
    vi.resetModules()
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY
  })

  it('does nothing when NEXT_PUBLIC_POSTHOG_KEY is unset', async () => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY
    const { initAnalytics } = await import('./analytics')
    initAnalytics()
    expect(posthog.init).not.toHaveBeenCalled()
  })

  it('reverse-proxies through /ingest (browser must not call posthog.com directly)', async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test_key'
    const { initAnalytics } = await import('./analytics')
    initAnalytics()
    expect(posthog.init).toHaveBeenCalledOnce()
    const [, opts] = (posthog.init as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0]!
    expect(opts.api_host).toBe('/ingest')
  })

  // The five flags below are HIPAA-load-bearing. Flipping any of them on
  // would risk PHI leaking into analytics — fail loudly if a future change
  // toggles them. See DATABASE_DESIGN.md §3j and CLAUDE.md "Analytics /
  // PostHog (PHI rule)".
  const cases: Array<[keyof PostHogInitOptions, unknown]> = [
    ['autocapture', false],
    ['mask_all_text', true],
    ['mask_all_element_attributes', true],
    ['capture_pageview', false],
    ['capture_pageleave', true],
  ]
  type PostHogInitOptions = {
    api_host: string
    autocapture: boolean
    mask_all_text: boolean
    mask_all_element_attributes: boolean
    capture_pageview: boolean
    capture_pageleave: boolean
  }

  for (const [flag, expected] of cases) {
    it(`pins ${String(flag)} = ${String(expected)} so PHI cannot leak`, async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test_key'
      const { initAnalytics } = await import('./analytics')
      initAnalytics()
      const [, opts] = (posthog.init as unknown as ReturnType<typeof vi.fn>)
        .mock.calls[0]!
      expect(opts[flag]).toBe(expected)
    })
  }
})

describe('track / identify / reset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('track forwards event name and properties to posthog.capture', () => {
    track('document_uploaded', { category: 'legal', file_type: 'pdf' })
    expect(posthog.capture).toHaveBeenCalledWith('document_uploaded', {
      category: 'legal',
      file_type: 'pdf',
    })
  })

  it('identifyUser passes the user id through unchanged', () => {
    identifyUser('user-cuid-123')
    expect(posthog.identify).toHaveBeenCalledWith('user-cuid-123')
  })

  it('resetAnalytics calls posthog.reset (used on logout)', () => {
    resetAnalytics()
    expect(posthog.reset).toHaveBeenCalledOnce()
  })
})
