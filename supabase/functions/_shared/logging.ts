/**
 * Shared logging utility for Supabase Edge Functions
 */

/**
 * Log levels for edge function operations
 */
export type LogLevel = 'info' | 'success' | 'warning' | 'error';

/**
 * Log an operation with structured metadata
 * 
 * @param operation - Name of the operation being performed
 * @param level - Log level (info, success, warning, error)
 * @param details - Additional context details as an object
 * @param message - Optional message describing the operation
 */
export function logOperation(
  operation: string,
  level: LogLevel,
  details: Record<string, any> = {},
  message?: string
): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    operation,
    level,
    details,
    message
  };

  const formattedMessage = `[${level.toUpperCase()}] [${timestamp}] ${operation}: ${message || ''}`;
  
  switch (level) {
    case 'error':
      console.error(formattedMessage, details);
      break;
    case 'warning':
      console.warn(formattedMessage, details);
      break;
    case 'success':
    case 'info':
    default:
      console.log(formattedMessage, details);
      break;
  }
  
}

/**
 * Log an error with structured metadata
 * 
 * @param operation - Name of the operation where the error occurred
 * @param error - The error object or message
 * @param details - Additional context details as an object
 */
export function logError(
  operation: string,
  error: unknown,
  details: Record<string, any> = {}
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorDetails = error instanceof Error ? { stack: error.stack } : {};
  
  logOperation(
    operation,
    'error',
    { ...details, ...errorDetails },
    errorMessage
  );
}
