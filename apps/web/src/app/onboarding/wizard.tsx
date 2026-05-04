'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { NameStep } from './name-step'
import { RecipientStep } from './recipient-step'
import { DoneStep } from './done-step'
import { wizardSchema, type WizardData } from './schema'

export function OnboardingWizard({
  initialName,
  locale,
}: {
  initialName: string
  locale: string
}) {
  const [step, setStep] = React.useState<1 | 2 | 3>(1)
  const [lastAddedName, setLastAddedName] = React.useState<string | null>(null)

  const form = useForm<WizardData>({
    resolver: zodResolver(wizardSchema),
    // RHF accepts partial/undefined values here even though the schema is
    // strict — validation only runs on trigger() or submit, so blank fields
    // are fine until then.
    defaultValues: {
      name: initialName,
      firstName: '',
      lastName: '',
      relationship: undefined,
      dateOfBirth: undefined,
      zipCode: '',
      careStage: undefined,
    },
    mode: 'onBlur',
  })

  const goToStep2 = async () => {
    const ok = await form.trigger(['name'])
    if (ok) setStep(2)
  }

  const onSubmitStep2 = form.handleSubmit(async (values) => {
    const res = await fetch('/api/care-recipients', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (!res.ok) {
      form.setError('root', {
        message: 'Something went wrong. Please try again.',
      })
      return
    }
    setLastAddedName(values.firstName)
    setStep(3)
  })

  const onAddAnother = () => {
    form.reset({
      ...form.getValues(),
      firstName: '',
      lastName: '',
      relationship: undefined,
      dateOfBirth: undefined,
      zipCode: '',
      careStage: undefined,
    })
    setStep(2)
  }

  // Hard nav so the dashboard layout's gates re-run on the new request.
  const onFinish = () => window.location.assign('/')

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <form onSubmit={onSubmitStep2}>
        {step === 1 && <NameStep form={form} onNext={goToStep2} />}
        {step === 2 && (
          <RecipientStep form={form} locale={locale} onBack={() => setStep(1)} />
        )}
        {step === 3 && (
          <DoneStep
            recipientName={lastAddedName ?? ''}
            onAddAnother={onAddAnother}
            onFinish={onFinish}
          />
        )}
      </form>
    </div>
  )
}
