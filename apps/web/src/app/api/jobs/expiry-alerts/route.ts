import { NextRequest, NextResponse } from 'next/server'

// Vercel Cron: runs daily at 9am UTC (see vercel.json)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // TODO Sprint 2: query documents expiring within 30/60/90 days and send emails
  return NextResponse.json({ ok: true, ran: new Date().toISOString() })
}
