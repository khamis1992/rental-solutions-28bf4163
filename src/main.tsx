
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/rtl.css';
import './styles/rtl-charts.css';
import './styles/rtl-forms.css';
import { TranslationProvider } from './contexts/TranslationContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import '@/i18n'; // Import i18n config

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <TranslationProvider>
        <App />
        <Toaster position="top-right" richColors />
      </TranslationProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
