// Tiny browser-side GraphQL fetcher. We don't need URQL/Apollo — TanStack
// Query handles caching, retries, and revalidation; this just speaks the
// wire format and throws on errors so the query hook surfaces them.

export class GraphQLClientError extends Error {
  constructor(public readonly errors: { message: string }[]) {
    super(errors.map((e) => e.message).join('; ') || 'GraphQL request failed')
    this.name = 'GraphQLClientError'
  }
}

interface GraphQLResponse<TData> {
  data?: TData
  errors?: { message: string }[]
}

export async function graphqlFetch<TData, TVariables = Record<string, unknown>>(
  query: string,
  variables?: TVariables,
): Promise<TData> {
  const res = await fetch('/api/graphql', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })

  const body = (await res.json()) as GraphQLResponse<TData>

  if (body.errors && body.errors.length > 0) {
    throw new GraphQLClientError(body.errors)
  }
  if (!body.data) {
    throw new GraphQLClientError([{ message: 'No data in response' }])
  }
  return body.data
}
