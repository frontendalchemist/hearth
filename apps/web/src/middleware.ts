import { auth0 } from './lib/auth0'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // E2E smoke-test escape hatch. The Playwright job in CI boots the dev
  // server with placeholder Auth0 env vars (so it doesn't depend on a
  // real Auth0 tenant), but auth0.middleware() does OIDC discovery on the
  // first request and crashes with DomainResolutionError when the domain
  // doesn't resolve — hanging the dev server long enough for Playwright's
  // webServer health check to time out. This flag short-circuits the
  // middleware so the public /login page renders. Never set in any
  // deployed environment; only in .github/workflows/ci.yml's e2e job.
  if (process.env.E2E_SKIP_AUTH0_MIDDLEWARE === 'true') {
    return NextResponse.next()
  }
  return await auth0.middleware(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
