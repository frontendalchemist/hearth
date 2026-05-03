// Shared Sentry init options for the Node, Edge, and browser SDKs.
// Centralized here so all three runtimes share the same PHI-scrubbing rules
// — duplicating them across instrumentation.ts and instrumentation-client.ts
// is the easiest way for a future change to land in only one and silently
// leak PHI from the runtime that was forgotten.

import type { Breadcrumb, ErrorEvent } from '@sentry/nextjs'

const isProd = process.env.NODE_ENV === 'production'

// PHI-leak risk: query strings can carry shareLink tokens, recipient ids,
// or future filter params with names. The path itself is fine — that's
// route shape — but anything after `?` gets dropped before send.
function stripQueryString(url: string | undefined): string | undefined {
  if (!url) return url
  const queryStart = url.indexOf('?')
  if (queryStart === -1) return url
  return url.slice(0, queryStart)
}

// Walks the event and removes anything that could carry a name, email, DOB,
// or document title. The Sentry defaults are already conservative when
// sendDefaultPii is false, but the rules below are belt-and-suspenders —
// safer to over-scrub than to leak PHI through a default Sentry forgets to
// turn off in a future SDK release.
export function scrubEvent(event: ErrorEvent): ErrorEvent | null {
  // Drop user identity except the internal cuid (the same rule the analytics
  // layer enforces — see analytics.ts).
  if (event.user) {
    event.user = { id: event.user.id }
  }

  if (event.request?.url) {
    event.request.url = stripQueryString(event.request.url)
  }
  if (event.request?.query_string) {
    delete event.request.query_string
  }
  if (event.request?.cookies) {
    delete event.request.cookies
  }
  if (event.request?.data) {
    // Form bodies may contain free-text values — drop entirely. We log
    // *that* a request happened, never *what* was in it.
    delete event.request.data
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map(scrubBreadcrumb).filter(
      (b): b is Breadcrumb => b !== null,
    )
  }

  return event
}

export function scrubBreadcrumb(crumb: Breadcrumb): Breadcrumb | null {
  // Drop user-input crumbs entirely — Sentry auto-captures `ui.input`
  // events that include the typed value, which can carry PHI verbatim.
  if (crumb.category === 'ui.input') return null

  if (crumb.data) {
    if (typeof crumb.data.url === 'string') {
      crumb.data.url = stripQueryString(crumb.data.url)
    }
    // fetch / xhr breadcrumbs include url + method + status — keep those,
    // drop request/response bodies if Sentry ever attaches them.
    delete crumb.data.body
    delete crumb.data.response_body_size
    delete crumb.data.request_body_size
  }

  return crumb
}

export const commonOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Sample 10% of normal traces in prod, 100% in dev for visibility while
  // building. Increase prod sample rate only if you've confirmed the volume
  // doesn't blow past Sentry's free-tier event quota.
  tracesSampleRate: isProd ? 0.1 : 1.0,
  // Keep stacktraces on every event including thrown plain Errors — these
  // are the most useful debugging signal and never carry PHI.
  attachStacktrace: true,
  // CRITICAL: never enable. Sentry's "default PII" includes IP, cookies,
  // and request body — all of which can carry PHI in a HIPAA-adjacent app.
  sendDefaultPii: false,
  // No session replay — would record DOM mutations including form values
  // and document titles. PHI nightmare.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  // Hard-stop scrubbers. See scrubEvent / scrubBreadcrumb above.
  beforeSend: scrubEvent,
  beforeBreadcrumb: scrubBreadcrumb,
}
