'use client'

import * as React from 'react'
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'
import type { Matcher } from 'react-day-picker'
import { CalendarIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatDate } from '@/lib/format/date'

type DateFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  label: string
  locale: string
  placeholder?: string
  description?: string
  /** Earliest selectable month — passed to react-day-picker. */
  startMonth?: Date
  /** Latest selectable month — passed to react-day-picker. */
  endMonth?: Date
  /** Disabled-date matcher (e.g. `{ after: new Date() }`). */
  disabled?: Matcher | Matcher[]
  /** Month the calendar opens to when no value is selected. */
  defaultMonth?: Date
}

export function DateField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  locale,
  placeholder = 'Pick a date',
  description,
  startMonth,
  endMonth,
  disabled,
  defaultMonth,
}: DateFieldProps<TFieldValues>) {
  const [open, setOpen] = React.useState(false)

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const value = field.value as Date | undefined
        return (
          <div>
            <Label htmlFor={name}>{label}</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  id={name}
                  type="button"
                  variant="outline"
                  className="mt-1 w-full justify-start font-normal"
                  aria-invalid={!!fieldState.error}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {value ? (
                    formatDate(value, locale, { dateStyle: 'long' })
                  ) : (
                    <span className="text-muted-foreground">{placeholder}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={value}
                  onSelect={(date) => {
                    field.onChange(date)
                    setOpen(false)
                  }}
                  disabled={disabled}
                  captionLayout="dropdown"
                  defaultMonth={value ?? defaultMonth}
                  startMonth={startMonth}
                  endMonth={endMonth}
                />
              </PopoverContent>
            </Popover>
            {description && !fieldState.error && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
            {fieldState.error && (
              <p role="alert" className="mt-1 text-sm text-destructive">
                {fieldState.error.message}
              </p>
            )}
          </div>
        )
      }}
    />
  )
}
