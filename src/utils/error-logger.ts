
import { ErrorData } from '@/contexts/ErrorContext';

// Configuration for error logging
interface ErrorLoggerConfig {
  enableConsoleLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  includeTimestamp: boolean;
  includeStack: boolean;
  disableInProduction: boolean;
}

// Default configuration
const defaultConfig: ErrorLoggerConfig = {
  enableConsoleLogging: true,
  logLevel: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
  includeTimestamp: true,
  includeStack: process.env.NODE_ENV !== 'production',
  disableInProduction: true
};

// Current configuration
let config: ErrorLoggerConfig = { ...defaultConfig };

// Configure the logger
export function configureErrorLogger(newConfig: Partial<ErrorLoggerConfig>) {
  config = { ...config, ...newConfig };
}

// Log an error
export function logError(error: Error | ErrorData | string, context?: string) {
  if (!config.enableConsoleLogging || (process.env.NODE_ENV === 'production' && config.disableInProduction)) return;
  
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
}

// Is a log level enabled
function isLevelEnabled(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
  if (process.env.NODE_ENV === 'production' && config.disableInProduction) return false;
  if (!config.enableConsoleLogging) return false;
  
  const levels = ['debug', 'info', 'warn', 'error'];
  const configLevelIndex = levels.indexOf(config.logLevel);
  const checkLevelIndex = levels.indexOf(level);
  
  // If the level being checked is greater than or equal to the configured level, it's enabled
  return checkLevelIndex >= configLevelIndex;
}

// Create a namespaced logger
export function createLogger(namespace: string) {
  return {
    debug: (message: string, ...data: any[]) => {
      if (isLevelEnabled('debug')) {
        if (data.length > 0) {
          console.debug(`[${namespace}] ${message}`, ...data);
        } else {
          console.debug(`[${namespace}] ${message}`);
        }
      }
    },
    info: (message: string, ...data: any[]) => {
      if (isLevelEnabled('info')) {
        if (data.length > 0) {
          console.info(`[${namespace}] ${message}`, ...data);
        } else {
          console.info(`[${namespace}] ${message}`);
        }
      }
    },
    warn: (message: string, ...data: any[]) => {
      if (isLevelEnabled('warn')) {
        if (data.length > 0) {
          console.warn(`[${namespace}] ${message}`, ...data);
        } else {
          console.warn(`[${namespace}] ${message}`);
        }
      }
    },
    error: (message: string | Error, ...data: any[]) => {
      if (isLevelEnabled('error')) {
        const errorMessage = message instanceof Error ? message.message : message;
        if (data.length > 0) {
          console.error(`[${namespace}] ${errorMessage}`, ...data);
          if (message instanceof Error && config.includeStack && message.stack) {
            console.error(message.stack);
          }
        } else {
          console.error(`[${namespace}] ${errorMessage}`);
          if (message instanceof Error && config.includeStack && message.stack) {
            console.error(message.stack);
          }
        }
      }
    }
  };
}

// Initialize logger with environment-specific settings
export function initializeLogger() {
  // In production, only show errors by default
  if (process.env.NODE_ENV === 'production') {
    configureErrorLogger({
      logLevel: 'error',
      includeStack: false,
      disableInProduction: false // Allow some logs in production, but only errors
    });
  } 
  // In development, show all logs
  else {
    configureErrorLogger({
      logLevel: 'debug',
      includeStack: true,
      disableInProduction: false
    });
  }
}

// Initialize with default settings
initializeLogger();

export default {
  configureErrorLogger,
  logError,
  createLogger,
  initializeLogger
};
