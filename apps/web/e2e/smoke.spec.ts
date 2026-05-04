import { expect, test } from '@playwright/test'

// Auth-gated routes go through `auth0.middleware()`, which performs OIDC
// discovery against AUTH0_DOMAIN. With the placeholder domain CI uses
// (example.auth0.com) that lookup throws DomainResolutionError and the dev
// server 500s before the dashboard layout's redirect can run. The auth-gate
// test therefore only runs when AUTH0_DOMAIN points at a real tenant —
// which is the case on a developer's machine running against a real .env
// (exported into the shell), and on any future CI job that wires real
// test-tenant creds via secrets.
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN
const hasRealAuth0 = Boolean(AUTH0_DOMAIN) && AUTH0_DOMAIN !== 'example.auth0.com'

test.describe('smoke', () => {
  test('login page renders the brand mark, tagline, and sign-in CTA', async ({
    page,
  }) => {
    // Hit /login directly instead of relying on the / → /login redirect:
    // / runs through Auth0 middleware, which crashes with
    // DomainResolutionError in the e2e CI job's placeholder-Auth0 setup.
    // /login is excluded from the middleware matcher, so it renders
    // without contacting Auth0.
    await page.goto('/login')

    await expect(
      page.getByRole('heading', { level: 1, name: 'Hearth' }),
    ).toBeVisible()
    await expect(page.getByText('Family caregiving, coordinated')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
  })

  test('unauthenticated request to /dashboard redirects to /login', async ({
    page,
  }) => {
    test.skip(
      !hasRealAuth0,
      'Requires a real AUTH0_DOMAIN; the placeholder used in CI breaks the auth middleware before the redirect can run.',
    )

    const response = await page.goto('/dashboard/workspace')

    // Playwright follows the 307 transparently; both the final URL and the
    // splash heading should reflect that we ended on /login.
    expect(page.url()).toMatch(/\/login$/)
    expect(response?.ok()).toBe(true)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Hearth' }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
  })
})
