import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import { requireAuth } from '@/lib/auth'
import { hasAcceptedAllRequired } from '@/lib/consent'
import { ConsentForm } from './consent-form'

export default async function ConsentPage() {
  // requireAuth() throws a 401 Response on no session, but server components
  // shouldn't surface 401s — redirect to login instead, mirroring
  // requireSession()'s behavior.
  let user
  try {
    user = await requireAuth()
  } catch {
    redirect('/login' as Route)
  }

  // Already accepted everything → don't show the form, just send them on.
  if (await hasAcceptedAllRequired(user.id)) {
    redirect('/' as Route)
  }

  const t = await getTranslations('consent')

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-xl">
        <h1 className="font-serif text-3xl text-foreground">{t('title')}</h1>
        <p className="mt-3 text-muted-foreground">{t('body')}</p>
        <div className="mt-8">
          <ConsentForm />
        </div>
      </div>
    </div>
  )
}
