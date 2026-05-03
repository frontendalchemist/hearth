import { db } from '@hearth/db'

// Bumped when a policy materially changes — bumping the version forces all
// users to re-accept on next request, since the unique constraint is
// (userId, consentType, version). Keep the values in sync with the
// `version` field stored on the corresponding /docs page.
export const CONSENT_VERSIONS = {
  TERMS_OF_SERVICE: '1.0',
  PRIVACY_POLICY: '1.0',
} as const

export type ConsentType = keyof typeof CONSENT_VERSIONS

// Single source of truth for "what must be accepted before a user can enter
// the dashboard." The (dashboard) layout reads from here, the /consent page
// renders from here, and POST /api/consent validates against here. Adding a
// new consent here is the entire change required to introduce one.
export const REQUIRED_CONSENTS: ReadonlyArray<{
  type: ConsentType
  version: string
}> = (Object.keys(CONSENT_VERSIONS) as ConsentType[]).map((type) => ({
  type,
  version: CONSENT_VERSIONS[type],
}))

/**
 * True when the user has an unrevoked ConsentRecord row for every
 * (type, version) entry in `REQUIRED_CONSENTS`. False if any are missing
 * or revoked. Used as the dashboard gate.
 */
export async function hasAcceptedAllRequired(userId: string): Promise<boolean> {
  if (REQUIRED_CONSENTS.length === 0) return true

  const accepted = await db.consentRecord.findMany({
    where: {
      userId,
      revokedAt: null,
      OR: REQUIRED_CONSENTS.map(({ type, version }) => ({
        consentType: type,
        version,
      })),
    },
    select: { consentType: true, version: true },
  })

  const acceptedKeys = new Set(
    accepted.map((r) => `${r.consentType}:${r.version}`),
  )
  return REQUIRED_CONSENTS.every(({ type, version }) =>
    acceptedKeys.has(`${type}:${version}`),
  )
}

/**
 * Persists acceptance of every required consent in a single batch. Idempotent
 * via `skipDuplicates` — if a user re-submits the form (e.g. double-click,
 * back-button-then-resubmit) already-accepted rows stay untouched and their
 * original `acceptedAt` is preserved (the legally-meaningful timestamp).
 */
export async function recordRequiredConsents(
  userId: string,
  ipAddress: string | null,
): Promise<void> {
  await db.consentRecord.createMany({
    data: REQUIRED_CONSENTS.map(({ type, version }) => ({
      userId,
      consentType: type,
      version,
      ipAddress,
    })),
    skipDuplicates: true,
  })
}

/**
 * Pulls the client IP out of the request headers Netlify forwards. The
 * `x-forwarded-for` header may contain a comma-separated chain of IPs
 * (client, proxy1, proxy2, ...) — the leftmost entry is the original
 * client. Falls back to `x-real-ip` if Netlify ever drops the chain
 * header, then to null (so the column stays nullable rather than lying).
 */
export function readClientIp(headers: Headers): string | null {
  const xff = headers.get('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0]?.trim()
    if (first) return first
  }
  const real = headers.get('x-real-ip')
  return real?.trim() || null
}
