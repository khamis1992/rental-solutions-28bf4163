
import { useErrorStore } from '@/store/useErrorStore';

/**
 * Global error monitoring and handling
 * This can be expanded to include integration with external services
 */

// Save original console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Setup global error handlers
export function setupGlobalErrorHandlers() {
  // Override console.error to track errors centrally
  console.error = (...args) => {
    // Call original console.error
    originalConsoleError.apply(console, args);
    
    // Extract error information
    let errorMessage = '';
    let errorStack = '';
    let errorObject = null;
    
    for (const arg of args) {
      if (arg instanceof Error) {
        errorObject = arg;
        errorMessage = arg.message;
        errorStack = arg.stack || '';
        break;
      } else if (typeof arg === 'string') {
        errorMessage = arg;
      }
    }
    
    // Add to our central error store if not already there
    if (errorMessage) {
      try {
        const lastError = useErrorStore.getState().lastError;
        
        // Avoid duplicate errors in quick succession
        if (!lastError || lastError.message !== errorMessage) {
          useErrorStore.getState().addError({
            message: errorMessage,
            stack: errorStack,
            severity: 'error',
            handled: false,
            context: { consoleArgs: args.filter(arg => typeof arg !== 'function') }
          });
        }
      } catch (e) {
        // Fail silently if the store is not available yet
      }
    }
  };
  
  // Global unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    
    try {
      useErrorStore.getState().addError({
        message: error?.message || 'Unhandled Promise Rejection',
        stack: error?.stack,
        severity: 'error',
        handled: false,
        context: { originalEvent: { type: event.type } }
      });
    } catch (e) {
      // Fail silently if the store is not available yet
    }
    
    // Log with original console to avoid recursion
    originalConsoleError('Unhandled Promise Rejection:', error);
  });
  
  // Global error handler for uncaught exceptions
  window.addEventListener('error', (event) => {
    try {
      useErrorStore.getState().addError({
        message: event.message || 'Uncaught Exception',
        stack: event.error?.stack,
        severity: 'error',
        handled: false,
        context: {
          originalEvent: {
            type: event.type,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        }
      });
    } catch (e) {
      // Fail silently if the store is not available yet
    }
    
    // Log with original console to avoid recursion
    originalConsoleError('Uncaught Exception:', event.error);
  });
}

// Call this in main.tsx to initialize error tracking
export function initErrorMonitoring() {
  setupGlobalErrorHandlers();
  
  // Could also initialize external monitoring services here
  console.log('Error monitoring initialized');
}
