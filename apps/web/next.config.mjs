import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ]
  },
}

// Wrap with Sentry only when SENTRY_AUTH_TOKEN is set so dev builds without
// a Sentry account succeed. The token is required for source-map upload
// and release tracking; without it the SDK still runs at runtime (governed
// by NEXT_PUBLIC_SENTRY_DSN), it just can't tag releases or symbolicate.
const sentryEnabled = Boolean(process.env.SENTRY_AUTH_TOKEN)

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      // Quiet build output for routine deploys; flip on for debugging.
      silent: true,
      // Hide the source maps from the public network after upload — Sentry
      // still gets them via the auth token, but bundle.js.map is not served.
      hideSourceMaps: true,
      // Let Sentry instrument server actions / Route Handlers automatically.
      autoInstrumentServerFunctions: true,
      // Don't auto-instrument middleware — it runs in Edge runtime and the
      // wrapping has bitten us before; opt in once we have a real need.
      autoInstrumentMiddleware: false,
      // Tunnels client SDK requests through /monitoring to dodge ad blockers
      // (the same trick we use for PostHog at /ingest).
      tunnelRoute: '/monitoring',
    })
  : nextConfig
