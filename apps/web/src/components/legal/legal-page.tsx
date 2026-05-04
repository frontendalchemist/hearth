import Link from 'next/link'
import type { Route } from 'next'
import { formatDate } from '@/lib/format/date'

// Shared chrome for /terms and /privacy. Renders the DRAFT banner up top
// (load-bearing — the legal body of these pages is placeholder copy meant
// to be replaced wholesale by counsel before launch), the page title,
// the Last-updated date in the requesting locale, the page body, and a
// Back-to-home link. The legal body itself is rendered inline by each
// page as JSX rather than via t() — translation of legal text is its own
// (counsel-led) workflow, separate from the i18n string infrastructure.
//
// Sync on purpose so the parent server pages can be unit-tested via
// `await PrivacyPage()` + render(); they handle the async getTranslations
// / getLocale calls and pass the resulting strings down.
export function LegalPage({
  title,
  lastUpdatedAt,
  locale,
  draftBannerText,
  lastUpdatedLabel,
  backToHomeLabel,
  children,
}: {
  title: string
  lastUpdatedAt: Date
  locale: string
  draftBannerText: string
  lastUpdatedLabel: string
  backToHomeLabel: string
  children: React.ReactNode
}) {
  const formatted = formatDate(lastUpdatedAt, locale, {
    dateStyle: 'long',
    timeZone: 'UTC',
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div
          role="status"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-foreground"
        >
          <p className="font-medium">{draftBannerText}</p>
        </div>

        <header className="mt-10">
          <h1 className="font-serif text-4xl text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {lastUpdatedLabel}:{' '}
            <time dateTime={lastUpdatedAt.toISOString()}>{formatted}</time>
          </p>
        </header>

        <article className="mt-8 space-y-6 text-foreground [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-2 [&_p]:leading-relaxed [&_p]:text-foreground/90 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_li]:text-foreground/90">
          {children}
        </article>

        <footer className="mt-12 border-t border-border pt-6">
          <Link
            href={'/' as Route}
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            ← {backToHomeLabel}
          </Link>
        </footer>
      </div>
    </div>
  )
}
