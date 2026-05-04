import { z } from 'zod'
import type { UseFormReturn } from 'react-hook-form'
// Type-only import: erased at build time so this file (imported by client
// components) doesn't pull `@hearth/db` — and transitively
// `audit-log.ts` / `node:async_hooks` — into the browser bundle.
import type { CareStage } from '@hearth/db'

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

// Runtime mirror of the Prisma `CareStage` enum, in declaration order. The
// `satisfies readonly CareStage[]` check fails the build if a stage is added
// or removed in `schema.prisma` without updating this list.
export const CARE_STAGES = [
  'STAGE_1_INDEPENDENT',
  'STAGE_2_SOME_HELP',
  'STAGE_3_ASSISTED_LIVING',
  'STAGE_4_MEMORY_CARE',
  'STAGE_5_END_OF_LIFE',
] as const satisfies readonly CareStage[]

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
  careStage: z.enum(CARE_STAGES),
})

export type WizardData = z.infer<typeof wizardSchema>
export type WizardForm = UseFormReturn<WizardData>
