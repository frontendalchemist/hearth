import { afterEach, describe, expect, it, vi } from 'vitest'
import { graphqlFetch, GraphQLClientError } from './client'

afterEach(() => {
  vi.restoreAllMocks()
})

function mockFetch(body: unknown, init: ResponseInit = {}) {
  // Build a fresh Response per call — Response bodies are single-use streams,
  // so reusing one across `await graphqlFetch(...)` invocations would 500 on
  // the second call.
  return vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...(init.headers ?? {}),
        },
      }),
    ),
  )
}

describe('graphqlFetch', () => {
  it('POSTs to /api/graphql with the query and parsed variables', async () => {
    const fetchSpy = mockFetch({ data: { ping: 'pong' } })

    await graphqlFetch<{ ping: string }>('query { ping }', { name: 'x' })

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/graphql',
      expect.objectContaining({
        method: 'POST',
        credentials: 'same-origin',
      }),
    )
    const body = JSON.parse(
      (fetchSpy.mock.calls[0]?.[1]?.body as string) ?? '{}',
    )
    expect(body).toEqual({ query: 'query { ping }', variables: { name: 'x' } })
  })

  it('returns the data field on success', async () => {
    mockFetch({ data: { ok: true } })

    const data = await graphqlFetch<{ ok: boolean }>('query { ok }')

    expect(data).toEqual({ ok: true })
  })

  it('throws GraphQLClientError when the response carries errors', async () => {
    mockFetch({ errors: [{ message: 'boom' }, { message: 'kaboom' }] })

    await expect(graphqlFetch('q')).rejects.toBeInstanceOf(GraphQLClientError)
    await expect(graphqlFetch('q')).rejects.toThrow('boom; kaboom')
  })

  it('throws when the response has neither data nor errors', async () => {
    mockFetch({})

    await expect(graphqlFetch('q')).rejects.toThrow('No data in response')
  })
})
