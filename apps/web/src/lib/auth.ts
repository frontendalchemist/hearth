import { getSession } from '@auth0/nextjs-auth0'
import { NextRequest, NextResponse } from 'next/server'

export type AuthUser = {
  sub: string
  email: string
  name: string
  roles: string[]
}

/**
 * Call at the top of every Route Handler that requires authentication.
 * Returns the authenticated user or throws a 401 response.
 *
 * Usage:
 *   const user = await requireAuth(req)
 */
export async function requireAuth(req: NextRequest): Promise<AuthUser> {
  const session = await getSession()

  if (!session?.user) {
    throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roles: string[] =
    (session.user['https://hearth.app/roles'] as string[]) ?? []

  return {
    sub: session.user.sub as string,
    email: session.user.email as string,
    name: session.user.name as string,
    roles,
  }
}

export function hasRole(user: AuthUser, role: string): boolean {
  return user.roles.includes(role)
}

export function requireRole(user: AuthUser, role: string): void {
  if (!hasRole(user, role)) {
    throw NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
