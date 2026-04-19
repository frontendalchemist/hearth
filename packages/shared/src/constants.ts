export const CARE_STAGE_LABELS: Record<string, string> = {
  STAGE_1_INDEPENDENT: 'Stage 1 — Independent',
  STAGE_2_SOME_HELP: 'Stage 2 — Some Help Needed',
  STAGE_3_ASSISTED_LIVING: 'Stage 3 — Assisted Living',
  STAGE_4_MEMORY_CARE: 'Stage 4 — Memory Care',
  STAGE_5_END_OF_LIFE: 'Stage 5 — End of Life',
}

export const DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  LEGAL: 'Legal',
  MEDICAL: 'Medical',
  FINANCIAL: 'Financial',
  INSURANCE: 'Insurance',
  IDENTITY: 'Identity',
  OTHER: 'Other',
}

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 // 50MB

export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
