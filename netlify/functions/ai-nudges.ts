// Netlify Scheduled Function — see ./expiry-alerts.ts for the
// trigger-vs-work split rationale.
import type { Config } from '@netlify/functions'

const ROUTE_PATH = '/api/jobs/ai-nudges'

export default async () => {
  const baseUrl = process.env.URL ?? process.env.DEPLOY_PRIME_URL
  const cronSecret = process.env.CRON_SECRET

  if (!baseUrl) {
    return new Response('Missing site URL (Netlify URL/DEPLOY_PRIME_URL)', {
      status: 500,
    })
  }
  if (!cronSecret) {
    return new Response('Missing CRON_SECRET env var', { status: 500 })
  }

  const res = await fetch(`${baseUrl}${ROUTE_PATH}`, {
    headers: { Authorization: `Bearer ${cronSecret}` },
  })

  return new Response(`upstream ${res.status}`, { status: res.status })
}

export const config: Config = {
  // Mondays at 10:00 UTC. The AI nudge job composes a weekly digest;
  // Monday morning matches the original product cadence captured in the
  // Route Handler comment.
  schedule: '0 10 * * 1',
}
