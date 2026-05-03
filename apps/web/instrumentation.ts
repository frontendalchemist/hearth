// Server + Edge runtime Sentry init. Next.js calls register() once per
// process; we dispatch on NEXT_RUNTIME so the Edge runtime gets the lighter
// build. instrumentation-client.ts handles the browser side.

import { commonOptions } from './src/lib/sentry-options'

export async function register() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const Sentry = await import('@sentry/nextjs')
    Sentry.init({
      ...commonOptions,
      // tracesSampler can override sampleRate per-transaction once we have
      // route-specific perf budgets to enforce. Default to commonOptions.
    })
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    const Sentry = await import('@sentry/nextjs')
    Sentry.init(commonOptions)
  }
}

// Sentry recommends re-exporting onRequestError so Next.js's per-request
// error boundary forwards exceptions automatically. The wrapper is a no-op
// when the SDK didn't initialize (DSN missing).
export async function onRequestError(
  err: unknown,
  request: { path: string; method: string; headers: Record<string, string | undefined> },
  context: { routerKind: string; routePath: string; routeType: string },
) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return
  const Sentry = await import('@sentry/nextjs')
  Sentry.captureRequestError(err, request, context)
}
