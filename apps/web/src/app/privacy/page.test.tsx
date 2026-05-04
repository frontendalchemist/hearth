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

import PrivacyPage from './page'

afterEach(() => {
  cleanup()
})

describe('PrivacyPage', () => {
  it('renders the title sourced from the legal namespace', async () => {
    const ui = await PrivacyPage()
    render(ui)

    expect(
      screen.getByRole('heading', { level: 1, name: enMessages.legal.privacyTitle }),
    ).toBeInTheDocument()
  })

  it('renders the DRAFT banner — load-bearing while content is placeholder', async () => {
    const ui = await PrivacyPage()
    render(ui)

    expect(screen.getByText(enMessages.legal.draftBanner)).toBeInTheDocument()
  })

  it('renders the HIPAA NPP all-caps header (statutory language)', async () => {
    const ui = await PrivacyPage()
    render(ui)

    // Specific phrase the HIPAA NPP rule (45 CFR §164.520) requires verbatim.
    expect(
      screen.getByText(/THIS NOTICE DESCRIBES HOW MEDICAL INFORMATION/i),
    ).toBeInTheDocument()
  })

  it('exposes the Last-updated date as a <time> element with an ISO datetime', async () => {
    const ui = await PrivacyPage()
    const { container } = render(ui)

    const time = container.querySelector('time')
    expect(time).not.toBeNull()
    expect(time?.getAttribute('datetime')).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    )
  })

  it('links back to home so a logged-out visitor can leave the page', async () => {
    const ui = await PrivacyPage()
    render(ui)

    const link = screen.getByRole('link', { name: /Back to Hearth/i })
    expect(link).toHaveAttribute('href', '/')
  })
})
