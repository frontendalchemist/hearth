import { NextRequest, NextResponse } from 'next/server'

// Vercel Cron: runs Mondays at 10am UTC (see vercel.json)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // TODO Sprint 6: generate weekly AI care tips and send via email
  return NextResponse.json({ ok: true, ran: new Date().toISOString() })
}
