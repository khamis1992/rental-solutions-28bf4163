import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
// import App from './SimpleApp.tsx';
import './index.css';

// Import environment variables diagnostic test
import './env-test.ts';

// Initialize monitoring services
import { initializeMonitoring } from './services/monitoring';
import { ErrorBoundary } from './components/error/ErrorBoundary';
import { initPhoneNumberObserver } from './utils/phone-display-utils';

// Import enhanced environment validation
import { initializeEnvironmentValidation } from './utils/env-validator';
import { initializeProductionDetection } from './utils/production-env-detector';

// Import payment testing utilities in development
if (import.meta.env.DEV) {
  import('./utils/test-payment-creation.ts');
}

// Initialize environment validation early
initializeEnvironmentValidation();
initializeProductionDetection();

// Setup console error handling before app starts
if (import.meta.env.PROD) {
  // Production: Minimize console output
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = (...args) => {
    // Only log critical errors in production
    const message = args.join(' ');
    if (message.includes('chunk load') || message.includes('network') || message.includes('Environment')) {
      originalError(...args);
    }
  };
  
  console.warn = (...args) => {
    // Show environment-related warnings even in production
    const message = args.join(' ');
    if (message.includes('Environment') || message.includes('متغير')) {
      originalWarn(...args);
    }
  };
} else {
  // Development: Show all errors for debugging
  console.log('🔍 Development mode - All console errors visible for debugging');
}

// Initialize monitoring before app starts
initializeMonitoring();

// Initialize phone number observer
initPhoneNumberObserver();

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('root');
  if (!container) {
    console.error('❌ Root container not found!');
    return;
  }

  const root = createRoot(container);
  
  // Development error boundary for debugging
  if (import.meta.env.DEV) {
    root.render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  } else {
    // Production optimized render
    root.render(<App />);
  }
  
  console.log('🚀 Application mounted successfully');
});

// Register service worker for caching in production only (without PWA install features)
if ('serviceWorker' in navigator && !import.meta.env.DEV) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker registered successfully:', registration);
      })
      .catch(error => {
        console.warn('❌ Service Worker registration failed:', error);
      });
  });
} 