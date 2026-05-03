import { expect, test } from '@playwright/test'

test.describe('smoke', () => {
  test('unauthenticated visit to / lands on the login page', async ({ page }) => {
    // `/` redirects to `/login` for visitors without a session cookie. We
    // assert on the destination instead of the redirect itself so the test
    // survives if the redirect is later moved into middleware.
    await page.goto('/')

    await expect(page).toHaveURL(/\/login(\?.*)?$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Hearth' }),
    ).toBeVisible()
    await expect(page.getByText('Family caregiving, coordinated')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
  })
})
