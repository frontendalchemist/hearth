'use client'

import * as React from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type SubmitState = 'idle' | 'submitting' | 'error'

export function ConsentForm() {
  const t = useTranslations('consent')
  const [terms, setTerms] = React.useState(false)
  const [privacy, setPrivacy] = React.useState(false)
  const [state, setState] = React.useState<SubmitState>('idle')
  const [validationError, setValidationError] = React.useState(false)

  const allChecked = terms && privacy

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allChecked) {
      setValidationError(true)
      return
    }
    setValidationError(false)
    setState('submitting')

    const res = await fetch('/api/consent', { method: 'POST' })

    if (!res.ok) {
      setState('error')
      return
    }
    // Hard navigation so server components re-render with the new gate state.
    window.location.assign('/')
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <fieldset
        disabled={state === 'submitting'}
        className="flex flex-col gap-4"
      >
        <ConsentCheckbox
          id="consent-terms"
          checked={terms}
          onChange={setTerms}
          label={t('termsLabel')}
          linkText={t('termsLinkText')}
          // Pages live at /terms and /privacy and are filled in by HEA-30/31.
          // Linking to them now means a new tab 404s in dev, which is the
          // correct visible signal until those tickets land.
          linkHref={'/terms' as Route}
        />
        <ConsentCheckbox
          id="consent-privacy"
          checked={privacy}
          onChange={setPrivacy}
          label={t('privacyLabel')}
          linkText={t('privacyLinkText')}
          linkHref={'/privacy' as Route}
        />
      </fieldset>

      {validationError && (
        <p
          role="alert"
          className="mt-4 text-sm text-destructive"
        >
          {t('errorRequired')}
        </p>
      )}
      {state === 'error' && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {t('errorSubmit')}
        </p>
      )}

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={'/auth/logout' as Route}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {t('signOut')}
        </Link>
        <Button
          type="submit"
          size="lg"
          disabled={!allChecked || state === 'submitting'}
        >
          {t('continue')}
        </Button>
      </div>
    </form>
  )
}

function ConsentCheckbox({
  id,
  checked,
  onChange,
  label,
  linkText,
  linkHref,
}: {
  id: string
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  linkText: string
  linkHref: Route
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={cn(
          'mt-1 h-5 w-5 shrink-0 rounded border border-border accent-primary',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        )}
      />
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block text-sm text-foreground">
          {label}
        </label>
        <Link
          href={linkHref}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block text-sm text-primary underline-offset-4 hover:underline"
        >
          {linkText}
        </Link>
      </div>
    </div>
  )
}
