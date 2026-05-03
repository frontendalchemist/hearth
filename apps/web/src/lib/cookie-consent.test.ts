// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CONSENT_STORAGE_KEY,
  readConsent,
  writeConsent,
} from './cookie-consent'

afterEach(() => {
  window.localStorage.clear()
  vi.restoreAllMocks()
})

describe('readConsent', () => {
  it('returns null when no value has ever been written', () => {
    expect(readConsent()).toBeNull()
  })

  it('returns "accepted" / "declined" round-trip from writeConsent', () => {
    writeConsent('accepted')
    expect(readConsent()).toBe('accepted')

    writeConsent('declined')
    expect(readConsent()).toBe('declined')
  })

  it('returns null for an unrecognized stored value (defensive against tampering)', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'maybe')
    expect(readConsent()).toBeNull()
  })

  it('returns null when localStorage.getItem throws (e.g. storage disabled)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    expect(readConsent()).toBeNull()
  })
})

describe('writeConsent', () => {
  it('persists under the documented storage key', () => {
    writeConsent('accepted')
    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('accepted')
  })

  it('swallows storage errors so a disabled-storage browser still loads the page', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(() => writeConsent('accepted')).not.toThrow()
  })
})
