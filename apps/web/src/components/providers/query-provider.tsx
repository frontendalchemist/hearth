'use client'

import * as React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// One QueryClient per tab — we lazy-init via useState so the same instance
// survives across fast-refresh boundaries in dev. Defaults err on the side
// of fewer refetches, since most of our reads are stable enough that the
// blink of a network roundtrip would feel like a regression.
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
