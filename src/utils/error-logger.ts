
import { ErrorData } from '@/contexts/ErrorContext';

// Configuration for error logging
interface ErrorLoggerConfig {
  enableConsoleLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  includeTimestamp: boolean;
  includeStack: boolean;
}

// Default configuration
const defaultConfig: ErrorLoggerConfig = {
  enableConsoleLogging: process.env.NODE_ENV !== 'production',
  logLevel: 'error',
  includeTimestamp: true,
  includeStack: process.env.NODE_ENV !== 'production',
};

// Current configuration
let config: ErrorLoggerConfig = { ...defaultConfig };

// Configure the logger
export function configureErrorLogger(newConfig: Partial<ErrorLoggerConfig>) {
  config = { ...config, ...newConfig };
}

// Log an error
export function logError(error: Error | ErrorData | string, context?: string) {
  if (!config.enableConsoleLogging) return;
  
  const timestamp = config.includeTimestamp ? new Date().toISOString() : '';
  const prefix = context ? `[${context}]` : '';
  
  let errorObject: Error | null = null;
  let errorMessage = '';
  let errorStack = '';
  
  if (error instanceof Error) {
    errorObject = error;
    errorMessage = error.message;
    errorStack = error.stack || '';
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    // Handle ErrorData type
    errorMessage = error.message;
    errorStack = error.details || '';
  }
  
  switch (config.logLevel) {
    case 'debug':
      console.debug(`${timestamp} ${prefix} ${errorMessage}`);
      if (config.includeStack && errorStack) {
        console.debug(errorStack);
      }
      break;
    case 'info':
      console.info(`${timestamp} ${prefix} ${errorMessage}`);
      if (config.includeStack && errorStack) {
        console.info(errorStack);
      }
      break;
    case 'warn':
      console.warn(`${timestamp} ${prefix} ${errorMessage}`);
      if (config.includeStack && errorStack) {
        console.warn(errorStack);
      }
      break;
    case 'error':
    default:
      console.error(`${timestamp} ${prefix} ${errorMessage}`);
      if (config.includeStack && errorStack) {
        console.error(errorStack);
      }
      break;
  }
  
  // You can add additional logging backends here
  // For example, sending to a logging service
}

// Create a namespaced logger
export function createLogger(namespace: string) {
  return {
    debug: (message: string) => {
      if (config.logLevel === 'debug') {
        console.debug(`[${namespace}] ${message}`);
      }
    },
    info: (message: string) => {
      if (['debug', 'info'].includes(config.logLevel)) {
        console.info(`[${namespace}] ${message}`);
      }
    },
    warn: (message: string) => {
      if (['debug', 'info', 'warn'].includes(config.logLevel)) {
        console.warn(`[${namespace}] ${message}`);
      }
    },
    error: (error: Error | string) => {
      logError(error, namespace);
    }
  };
}

export default {
  configureErrorLogger,
  logError,
  createLogger
};
