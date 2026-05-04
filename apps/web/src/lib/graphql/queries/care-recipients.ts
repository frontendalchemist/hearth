import { useQuery } from '@tanstack/react-query'
import { graphqlFetch } from '../client'

export type GqlCareStage =
  | 'STAGE_1_INDEPENDENT'
  | 'STAGE_2_SOME_HELP'
  | 'STAGE_3_ASSISTED_LIVING'
  | 'STAGE_4_MEMORY_CARE'
  | 'STAGE_5_END_OF_LIFE'

export type CareRecipient = {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string | null
  careStage: GqlCareStage
  photoUrl: string | null
  relationship: string | null
  age: number | null
}

const CARE_RECIPIENTS_QUERY = /* GraphQL */ `
  query CareRecipients {
    careRecipients {
      id
      firstName
      lastName
      dateOfBirth
      careStage
      photoUrl
      relationship
      age
    }
  }
`

export const careRecipientsQueryKey = ['careRecipients'] as const

export async function fetchCareRecipients(): Promise<CareRecipient[]> {
  const data = await graphqlFetch<{ careRecipients: CareRecipient[] }>(
    CARE_RECIPIENTS_QUERY,
  )
  return data.careRecipients
}

export function useCareRecipientsQuery() {
  return useQuery({
    queryKey: careRecipientsQueryKey,
    queryFn: fetchCareRecipients,
  })
}
