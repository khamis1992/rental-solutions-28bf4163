
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';

import { SimpleErrorBoundary } from '@/components/ui/simple-error-boundary';
import { LoadingFallback } from '@/components/ui/loading-fallback';
import { MinimalAuthProvider } from '@/contexts/MinimalAuthContext';
import { AppRouter } from '@/components/routing/AppRouter';
import { useAppLoading } from '@/hooks/use-app-loading';

// Create QueryClient outside component to prevent recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1000,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const AppContent: React.FC = () => {
  const { isAppLoading, loadingProgress, loadingMessage, error } = useAppLoading();

  // Show loading screen during initialization
  if (isAppLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <LoadingFallback />
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">{loadingMessage}</p>
          <div className="w-64 bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Show error if initialization failed
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6">
          <h1 className="text-xl font-semibold text-red-600 mb-2">
            Application Failed to Load
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MinimalAuthProvider>
          <TooltipProvider>
            <SimpleErrorBoundary>
              <AppRouter />
              <Toaster />
              <Sonner />
            </SimpleErrorBoundary>
          </TooltipProvider>
        </MinimalAuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

function App() {
  return (
    <SimpleErrorBoundary>
      <AppContent />
    </SimpleErrorBoundary>
  );
}

export default App;
