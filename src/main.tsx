
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { reportWebVitals } from './reportWebVitals';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { setUpMonitoring } from '@/lib/monitoring';
import './tailwind.css';
import { ErrorBoundary } from '@/components/ui/error-boundary';

// Set up performance monitoring if available
if (typeof window !== 'undefined' && window.performance) {
  const performance = window.performance as unknown as Performance;
  setUpMonitoring(performance);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="ui-theme">
        <TooltipProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
          <Toaster />
        </TooltipProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);

// Report web vitals
reportWebVitals(console.log);
