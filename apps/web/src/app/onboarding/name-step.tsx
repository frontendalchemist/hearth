'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import type { WizardForm } from './schema'

export function NameStep({
  form,
  onNext,
}: {
  form: WizardForm
  onNext: () => void
}) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl">Confirm your name</h1>
        <p className="mt-2 text-muted-foreground">
          We use this on your profile and on documents you generate.
        </p>
      </header>

      <div>
        <Label htmlFor="name">Your name</Label>
        <Input id="name" className="mt-1" {...form.register('name')} />
        {form.formState.errors.name && (
          <p role="alert" className="mt-1 text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  )
}
