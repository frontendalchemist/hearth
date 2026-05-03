import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { readClientIp, recordRequiredConsents } from '@/lib/consent'

// Idempotent: writes one ConsentRecord per required (type, version) for the
// authenticated user, skipping any rows that already exist (so the original
// `acceptedAt` — the legally-meaningful timestamp — is preserved). The
// dashboard layout's gate is what decides whether to redirect users back to
// /consent; this endpoint just records intent.
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    await recordRequiredConsents(user.id, readClientIp(req.headers))
    return NextResponse.json({ ok: true })
  } catch (thrown) {
    if (thrown instanceof Response) return thrown
    throw thrown
  }
}
