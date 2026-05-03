import { expect, test } from '@playwright/test'

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
})
