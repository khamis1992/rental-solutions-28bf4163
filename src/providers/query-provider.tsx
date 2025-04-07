
import { 
  QueryClient, 
  QueryClientProvider,
  DefaultOptions
} from '@tanstack/react-query'
import React from 'react'

// Configure default query options for better performance
const defaultQueryOptions: DefaultOptions = {
  queries: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    retry: 1,
    // Add deduplication
    networkMode: 'offlineFirst',
  },
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
})

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <div>DevTools Placeholder</div>}
    </QueryClientProvider>
  )
}
