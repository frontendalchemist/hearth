// Source of truth for cookie/analytics consent in the browser. The PostHog
// provider gates `initAnalytics()` on `readConsent() === 'accepted'`, and the
// CookieConsentBanner reads/writes the same key — keep this module the only
// place that touches the storage key so a future move to a different store
// (e.g. an httpOnly cookie set by the server) is a one-file change.

export const CONSENT_STORAGE_KEY = 'hearth-cookie-consent'

export type ConsentState = 'accepted' | 'declined'

export function readConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    return value === 'accepted' || value === 'declined' ? value : null
  } catch {
    // localStorage can throw under privacy modes / disabled storage. Treat as
    // no decision recorded so the banner shows on the next paint.
    return null
  }
}

export function writeConsent(state: ConsentState): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, state)
  } catch {
    // Failing to persist is non-fatal — the user will see the banner again
    // next visit, which is the correct fallback for storage-disabled browsers.
  }
}
