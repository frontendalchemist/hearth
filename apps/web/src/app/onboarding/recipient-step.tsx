'use client'

import { Controller } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateField } from '@/components/shared/date-field'
import { CareStage } from '@hearth/db'

import {
  HUNDRED_TWENTY_YEARS_AGO,
  RELATIONSHIPS,
  STAGE_LABELS,
  TODAY,
  type WizardForm,
} from './schema'

export function RecipientStep({
  form,
  locale,
  onBack,
}: {
  form: WizardForm
  locale: string
  onBack: () => void
}) {
  const rootError = form.formState.errors.root?.message

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl">Tell us about your loved one</h1>
        <p className="mt-2 text-muted-foreground">
          We&apos;ll set up a private workspace for them with you as Admin.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            className="mt-1"
            {...form.register('firstName')}
          />
          {form.formState.errors.firstName && (
            <p role="alert" className="mt-1 text-sm text-destructive">
              {form.formState.errors.firstName.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            className="mt-1"
            {...form.register('lastName')}
          />
          {form.formState.errors.lastName && (
            <p role="alert" className="mt-1 text-sm text-destructive">
              {form.formState.errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="relationship">Relationship to you</Label>
        <Controller
          control={form.control}
          name="relationship"
          render={({ field, fieldState }) => (
            <>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="relationship"
                  className="mt-1 w-full"
                  aria-invalid={!!fieldState.error}
                >
                  <SelectValue placeholder="Select one" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((rel) => (
                    <SelectItem key={rel} value={rel}>
                      {rel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.error && (
                <p role="alert" className="mt-1 text-sm text-destructive">
                  {fieldState.error.message}
                </p>
              )}
            </>
          )}
        />
      </div>

      <DateField
        control={form.control}
        name="dateOfBirth"
        label="Date of birth"
        locale={locale}
        startMonth={HUNDRED_TWENTY_YEARS_AGO}
        endMonth={TODAY}
        defaultMonth={new Date(1950, 0, 1)}
        disabled={{ after: TODAY, before: HUNDRED_TWENTY_YEARS_AGO }}
      />

      <div>
        <Label htmlFor="zipCode">ZIP code</Label>
        <Input
          id="zipCode"
          className="mt-1"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="12345"
          {...form.register('zipCode')}
        />
        {form.formState.errors.zipCode && (
          <p role="alert" className="mt-1 text-sm text-destructive">
            {form.formState.errors.zipCode.message}
          </p>
        )}
      </div>

      <div>
        <Label>Estimated care stage</Label>
        <Controller
          control={form.control}
          name="careStage"
          render={({ field, fieldState }) => (
            <>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="mt-2 space-y-2"
              >
                {Object.values(CareStage).map((stage) => (
                  <div key={stage} className="flex items-center gap-2">
                    <RadioGroupItem id={stage} value={stage} />
                    <Label htmlFor={stage} className="font-normal">
                      {STAGE_LABELS[stage]}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {fieldState.error && (
                <p role="alert" className="mt-1 text-sm text-destructive">
                  {fieldState.error.message}
                </p>
              )}
            </>
          )}
        />
      </div>

      {rootError && (
        <p role="alert" className="text-sm text-destructive">
          {rootError}
        </p>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Add care recipient
        </Button>
      </div>
    </div>
  )
}
