
import { ErrorData, ErrorSeverity } from '@/contexts/ErrorContext';
import { showErrorNotification } from '@/utils/notification/error-notification-manager';

// Define error categories
export type ErrorCategory = 
  | 'api'
  | 'network'
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'database'
  | 'rendering'
  | 'business'
  | 'unknown';

// Define error type details
export interface ErrorDetails {
  category: ErrorCategory;
  code?: string;
  severity: ErrorSeverity;
  source?: string;
  details?: string;
  meta?: Record<string, any>;
}

// Define the service interface
class ErrorService {
  private static instance: ErrorService;
  private errorHandler?: (error: Omit<ErrorData, 'id' | 'timestamp' | 'handled'>) => string;
  
  private constructor() {
    // Private constructor for singleton pattern
  }
  
  // Get singleton instance
  public static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }
  
  // Initialize with error handler from context
  public initialize(handler: (error: Omit<ErrorData, 'id' | 'timestamp' | 'handled'>) => string) {
    this.errorHandler = handler;
  }
  
  // Handle API errors
  public handleApiError(error: any, context?: string): string | undefined {
    if (!this.errorHandler) {
      console.warn('Error service not initialized');
      return;
    }
    
    let errorMessage = 'An unexpected API error occurred';
    let errorCode = 'API_ERROR';
    let details = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      details = error.stack || '';
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (this.isPostgrestError(error)) {
      errorMessage = `Database error: ${error.message}`;
      errorCode = `DB_${error.code}`;
      
      // Handle specific database errors
      switch (error.code) {
        case '23505':
          errorMessage = 'A record with this information already exists.';
          break;
        case '23503':
          errorMessage = 'This record cannot be modified because it is referenced by other data.';
          break;
        case '42P01':
          errorMessage = 'Database table not found. Please contact support.';
          break;
        case '42703':
          errorMessage = 'Database column not found. Please contact support.';
          break;
        case '28000':
          errorMessage = 'Authentication failed. Please try signing in again.';
          break;
        case '40001':
          errorMessage = 'Database is temporarily unavailable. Please try again.';
          break;
        case '57014':
          errorMessage = 'Query timed out. Please try again with a simpler request.';
          break;
      }
    }
    
    if (context) {
      errorMessage = `${context}: ${errorMessage}`;
    }
    
    // Use notification manager to prevent duplicate notifications
    // for critical errors that might occur repeatedly
    if (errorCode.startsWith('DB_')) {
      showErrorNotification(errorCode, {
        description: errorMessage,
        id: `api-db-error-${errorCode}`,
      });
    }
    
    return this.errorHandler({
      message: errorMessage,
      severity: 'error',
      category: 'api',
      code: errorCode,
      details,
      source: context || 'api',
    });
  }
  
  // Handle network errors
  public handleNetworkError(error: any, context?: string): string | undefined {
    if (!this.errorHandler) {
      console.warn('Error service not initialized');
      return;
    }
    
    let errorMessage = 'A network error occurred. Please check your connection.';
    if (error instanceof Error) {
      errorMessage = `Network error: ${error.message}`;
    }
    
    if (context) {
      errorMessage = `${context}: ${errorMessage}`;
    }
    
    // Use notification manager to prevent duplicate network error notifications
    showErrorNotification('Network Error', {
      description: errorMessage,
      id: 'network-error',
    });
    
    return this.errorHandler({
      message: errorMessage,
      severity: 'error',
      category: 'network',
      code: 'NETWORK_ERROR',
      source: context || 'network',
    });
  }
  
  // Handle validation errors
  public handleValidationError(errors: Record<string, string[]>, context?: string): string | undefined {
    if (!this.errorHandler) {
      console.warn('Error service not initialized');
      return;
    }
    
    const formattedErrors = Object.entries(errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('\n');
    
    let errorMessage = `Validation failed: ${formattedErrors}`;
    
    if (context) {
      errorMessage = `${context}: ${errorMessage}`;
    }
    
    return this.errorHandler({
      message: errorMessage,
      severity: 'warning',
      category: 'validation',
      code: 'VALIDATION_ERROR',
      details: formattedErrors,
      source: context || 'validation',
    });
  }
  
  // Handle generic errors
  public handleError(
    error: any, 
    options: {
      context?: string;
      severity?: ErrorSeverity;
      category?: ErrorCategory;
      code?: string;
    } = {}
  ): string | undefined {
    if (!this.errorHandler) {
      console.warn('Error service not initialized');
      return;
    }
    
    const {
      context,
      severity = 'error',
      category = 'unknown',
      code = 'UNKNOWN_ERROR',
    } = options;
    
    let errorMessage = 'An unexpected error occurred';
    let details = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      details = error.stack || '';
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      errorMessage = error.message || JSON.stringify(error);
    }
    
    if (context) {
      errorMessage = `${context}: ${errorMessage}`;
    }
    
    // Use the notification manager for serious errors
    if (severity === 'error') {
      showErrorNotification(code, {
        description: errorMessage,
        id: `general-error-${category}-${code}`,
      });
    }
    
    return this.errorHandler({
      message: errorMessage,
      severity,
      category,
      code,
      details,
      source: context || 'application',
    });
  }
  
  // Type guard for Postgrest errors
  private isPostgrestError(error: unknown): error is { message: string; code: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      'code' in error
    );
  }
}

export const errorService = ErrorService.getInstance();
export default errorService;
