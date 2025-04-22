// Add type declarations
declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: Record<string, any>;
    performance: Performance;
  }
}

declare const process: {
  env: {
    NODE_ENV: 'development' | 'production' | 'test';
  };
};

import { createRoot } from 'react-dom/client';
import { startTransition } from 'react';
import ErrorBoundary from '@/components/ui/error-boundary';
import App from './App';
import './index.css';
import { initializePerformanceMonitoring } from '@/utils/performance-monitor';
import { preloadCriticalAssets, preconnectToCriticalDomains } from '@/utils/preload-critical';

// Initialize performance API if needed
if (typeof window !== 'undefined' && !window.performance) {
  window.performance = {
    now: () => Date.now(),
    getEntriesByType: () => [],
    mark: () => undefined,
    measure: () => undefined,
    clearMarks: () => undefined,
    clearMeasures: () => undefined
  } as Performance;
}

// Preload critical assets and establish connections early
if (typeof window !== 'undefined') {
  preloadCriticalAssets();
  preconnectToCriticalDomains();
}

// Initialize performance monitoring in production
if (process?.env?.NODE_ENV === 'production') {
  initializePerformanceMonitoring({
    debug: false,
    sampleRate: 0.1 // Sample 10% of users
  });

  // Disable React dev tools in production
  if (typeof window !== 'undefined' && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    Object.keys(window.__REACT_DEVTOOLS_GLOBAL_HOOK__).forEach(key => {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__![key] = 
        typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__![key] === 'function' ? () => {} : null;
    });
  }
}

// Initialize root with error boundary
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = createRoot(rootElement);

// Hydrate app with transition to prevent blocking
startTransition(() => {
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
});
