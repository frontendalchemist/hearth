// Netlify Scheduled Function — Hearth uses Netlify, not Vercel (see commit
// 2dda574). The function itself is a thin trigger: it forwards to the
// Route Handler in the Next.js app, which holds the actual job logic.
// This split keeps the cron secret check and the work in one place
// (the Route Handler) while letting Netlify own the schedule.
import type { Config } from '@netlify/functions'

const ROUTE_PATH = '/api/jobs/expiry-alerts'

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

  // Surface the upstream status so a failed job shows up red in the
  // Netlify Functions log instead of being silently swallowed.
  return new Response(`upstream ${res.status}`, { status: res.status })
}

export const config: Config = {
  // 09:00 UTC every day. Document expiry surfaces are time-of-day-stable,
  // so any UTC slot works; we picked early-UTC so North American users
  // see fresh alerts in the morning local time.
  schedule: '0 9 * * *',
}
