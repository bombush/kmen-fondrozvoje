"use client"

import { QueryCache, MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    queryCache: new QueryCache({
      onError: (error: Error) => {
        console.error(`Query error:`, error)
      }
    }),
    mutationCache: new MutationCache({
      onError: (error: Error) => {
        console.error(`Mutation error:`, error)
      }
    })
  }))


  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
} 