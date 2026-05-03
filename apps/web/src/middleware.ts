import { auth0 } from './lib/auth0'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await auth0.middleware(request)
}

export const config = {
  matcher: [
    // Exclusions:
    //   _next/static, _next/image, favicon.ico, sitemap.xml, robots.txt — assets
    //   api/health — public liveness probe; no session work to do
    //   login — public sign-in page; no session work to do, and skipping it
    //     keeps the e2e smoke job from hanging on Auth0 OIDC discovery when
    //     the test runs against placeholder AUTH0_DOMAIN
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/health|login).*)',
  ],
}
