import React, { useEffect } from 'react';
import '@/App.css';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TranslationProvider } from '@/contexts/TranslationContext';
import { usePrefetch } from '@/hooks/use-prefetch';
import RoutesComponent from './Routes';

// Component to apply app-wide prefetching
const PrefetchManager = () => {
  // Initialize prefetching for common navigation paths
  usePrefetch();
  return null;
};

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Add default settings for queries
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TranslationProvider>
          <PrefetchManager />
          <RoutesComponent />
        </TranslationProvider>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
