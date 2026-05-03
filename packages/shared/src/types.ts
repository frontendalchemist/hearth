// Shared types used across apps/web and any future apps/mobile

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string }

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Care stages — mirrors the Prisma enum but usable on the client
export type CareStage =
  | 'STAGE_1_INDEPENDENT'
  | 'STAGE_2_SOME_HELP'
  | 'STAGE_3_ASSISTED_LIVING'
  | 'STAGE_4_MEMORY_CARE'
  | 'STAGE_5_END_OF_LIFE'

export type UserRole = 'ADMIN' | 'COORDINATOR' | 'VIEWER'

export type DocumentCategory =
  | 'LEGAL'
  | 'MEDICAL'
  | 'FINANCIAL'
  | 'INSURANCE'
  | 'IDENTITY'
  | 'CARE_PLANS'
  | 'OTHER'

// Presigned upload request/response
export type PresignRequest = {
  filename: string
  mimeType: string
  sizeBytes: number
  careRecipientId: string
}

export type PresignResponse = {
  documentId: string
  uploadUrl: string
  fields: Record<string, string>
}
