import { getRequestConfig } from 'next-intl/server'

// Phase 0: English-only. The locale is hardcoded here on purpose — locale
// negotiation (per-user from `User.locale`, then Accept-Language fallback)
// is wired in a later ticket. Components/utilities must already use t() and
// Intl.DateTimeFormat from day one so that switch is config-only.
const DEFAULT_LOCALE = 'en'

export default getRequestConfig(async () => {
  const locale = DEFAULT_LOCALE
  const messages = (await import(`./messages/${locale}.json`)).default
  return { locale, messages }
})
