import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { NextIntlClientProvider } from 'next-intl'
import messages from '@/messages/en.json'
import { CookieConsentBanner } from '../cookie-consent-banner'

const meta: Meta<typeof CookieConsentBanner> = {
  component: CookieConsentBanner,
  title: 'Shared/CookieConsentBanner',
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="en" messages={messages}>
        <div style={{ minHeight: '100vh', position: 'relative' }}>
          <Story />
        </div>
      </NextIntlClientProvider>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof CookieConsentBanner>

// `forceVisible` bypasses the localStorage check so the banner renders
// regardless of prior consent — Storybook needs a deterministic preview.
export const Default: Story = {
  args: { forceVisible: true },
}
