// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

import enMessages from '@/messages/en.json'

vi.mock('next-intl/server', () => ({
  getLocale: vi.fn(async () => 'en'),
  getTranslations: vi.fn(async (namespace: 'legal') => {
    const ns = enMessages[namespace] as Record<string, string>
    const t = (key: string) => ns[key] ?? `MISSING:${namespace}.${key}`
    return t
  }),
}))

import TermsPage from './page'

afterEach(() => {
  cleanup()
})

describe('TermsPage', () => {
  it('renders the title sourced from the legal namespace', async () => {
    const ui = await TermsPage()
    render(ui)

    expect(
      screen.getByRole('heading', { level: 1, name: enMessages.legal.termsTitle }),
    ).toBeInTheDocument()
  })

  it('renders the DRAFT banner', async () => {
    const ui = await TermsPage()
    render(ui)

    expect(screen.getByText(enMessages.legal.draftBanner)).toBeInTheDocument()
  })

  it('cross-links to the privacy page from the privacy section', async () => {
    const ui = await TermsPage()
    render(ui)

    const link = screen.getByRole('link', { name: 'Privacy Policy' })
    expect(link).toHaveAttribute('href', '/privacy')
  })

  it('renders all the structural sections counsel will rewrite', async () => {
    const ui = await TermsPage()
    render(ui)

    // Pin a few headings so a future refactor that drops one fails this test.
    for (const heading of [
      'Eligibility and accounts',
      'Acceptable use',
      'Disclaimers',
      'Limitation of liability',
      'Governing law and disputes',
    ]) {
      expect(
        screen.getByText((content) => content.includes(heading)),
      ).toBeInTheDocument()
    }
  })
})
