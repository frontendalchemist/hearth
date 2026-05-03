// Browser Sentry init. Next 15.3+ runs this file once on app boot. The
// shared options in src/lib/sentry-options enforce HIPAA-safe defaults
// (no session replay, no PII, scrubbed query strings + form bodies).

import * as Sentry from '@sentry/nextjs'
import { commonOptions } from './src/lib/sentry-options'

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init(commonOptions)
}
