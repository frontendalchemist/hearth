import { z } from 'zod'
import type { UseFormReturn } from 'react-hook-form'
import { CareStage } from '@hearth/db'

export const RELATIONSHIPS = [
  'Mother',
  'Father',
  'Mother-in-law',
  'Father-in-law',
  'Spouse',
  'Sibling',
  'Grandparent',
  'Other',
] as const

export const STAGE_LABELS: Record<CareStage, string> = {
  STAGE_1_INDEPENDENT: 'Stage 1 — Independent',
  STAGE_2_SOME_HELP: 'Stage 2 — Needs some help',
  STAGE_3_ASSISTED_LIVING: 'Stage 3 — Assisted living',
  STAGE_4_MEMORY_CARE: 'Stage 4 — Memory care',
  STAGE_5_END_OF_LIFE: 'Stage 5 — End of life',
}

export const TODAY = new Date()
export const HUNDRED_TWENTY_YEARS_AGO = new Date(TODAY.getFullYear() - 120, 0, 1)

export const wizardSchema = z.object({
  // Step 1
  name: z.string().min(1, 'Please enter your name').max(200),

  // Step 2
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  relationship: z.enum(RELATIONSHIPS),
  dateOfBirth: z.coerce
    .date()
    .min(HUNDRED_TWENTY_YEARS_AGO, 'Please enter a valid date')
    .max(TODAY, "Date of birth can't be in the future"),
  zipCode: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid 5-digit ZIP code'),
  careStage: z.nativeEnum(CareStage),
})

export type WizardData = z.infer<typeof wizardSchema>
export type WizardForm = UseFormReturn<WizardData>
