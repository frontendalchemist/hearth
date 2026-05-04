// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider, useTranslations } from 'next-intl'
import messages from './messages/en.json'

function ProbeComponent() {
  const t = useTranslations('common')
  return <span>{t('appName')}</span>
}

describe('next-intl wiring', () => {
  it('useTranslations resolves the namespace and returns the keyed string', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ProbeComponent />
      </NextIntlClientProvider>,
    )

    expect(screen.getByText('Hearth')).toBeInTheDocument()
  })
})
