import { NextRequest, NextResponse } from 'next/server'

// Triggered Mondays at 10:00 UTC by netlify/functions/ai-nudges.ts.
// Bearer token is the shared CRON_SECRET (set in Netlify env).
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // TODO Sprint 6: generate weekly AI care tips and send via email
  return NextResponse.json({ ok: true, ran: new Date().toISOString() })
}
