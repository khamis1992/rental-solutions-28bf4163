import { toast } from '@/hooks/use-toast';
import { logError } from '@/services/monitoring';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  url?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface RecoveryAction {
  label: string;
  labelAr: string;
  action: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'destructive';
}

export interface ErrorRecoveryOptions {
  showToast?: boolean;
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  recoveryActions?: RecoveryAction[];
  fallbackComponent?: React.ComponentType;
  context?: ErrorContext;
}

class ErrorRecoveryService {
  private retryAttempts = new Map<string, number>();
  private readonly defaultMaxRetries = 3;
  private readonly defaultRetryDelay = 1000;

  /**
   * Handle an error with intelligent recovery options
   */
  async handleError(
    error: Error | string,
    options: ErrorRecoveryOptions = {}
  ): Promise<void> {
    const {
      showToast = true,
      autoRetry = false,
      maxRetries = this.defaultMaxRetries,
      retryDelay = this.defaultRetryDelay,
      recoveryActions = [],
      context = {}
    } = options;

    // Enhanced error context
    const enhancedContext: ErrorContext = {
      ...context,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ...context
    };

    // Log the error
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    logError(errorObj, enhancedContext);

    // Determine error type and appropriate response
    const errorType = this.categorizeError(errorObj);
    
    if (showToast) {
      this.showErrorToast(errorObj, errorType, recoveryActions);
    }

    // Auto-retry logic for recoverable errors
    if (autoRetry && this.isRetryableError(errorObj)) {
      const retryKey = this.getRetryKey(enhancedContext);
      const attempts = this.retryAttempts.get(retryKey) || 0;
      
      if (attempts < maxRetries) {
        this.retryAttempts.set(retryKey, attempts + 1);
        
        // Exponential backoff
        const delay = retryDelay * Math.pow(2, attempts);
        
        setTimeout(() => {
          // The calling code should implement the retry logic
          console.log(`Auto-retry attempt ${attempts + 1} for ${retryKey}`);
        }, delay);
      } else {
        // Max retries reached
        this.retryAttempts.delete(retryKey);
        toast.errorAr(
          'فشل في إعادة المحاولة',
          'Retry failed',
          'تم الوصول للحد الأقصى من المحاولات',
          'Maximum retry attempts reached'
        );
      }
    }
  }

  /**
   * Categorize error for appropriate handling
   */
  private categorizeError(error: Error): 'network' | 'auth' | 'validation' | 'permission' | 'server' | 'unknown' {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return 'network';
    }
    
    if (message.includes('unauthorized') || message.includes('401')) {
      return 'auth';
    }
    
    if (message.includes('forbidden') || message.includes('403')) {
      return 'permission';
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }
    
    if (message.includes('server') || message.includes('500') || message.includes('502') || message.includes('503')) {
      return 'server';
    }
    
    return 'unknown';
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const retryablePatterns = [
      'network',
      'timeout',
      'fetch',
      '500',
      '502',
      '503',
      '504'
    ];
    
    return retryablePatterns.some(pattern => 
      error.message.toLowerCase().includes(pattern)
    );
  }

  /**
   * Generate retry key for tracking attempts
   */
  private getRetryKey(context: ErrorContext): string {
    return `${context.component || 'unknown'}_${context.action || 'unknown'}_${context.url || ''}`;
  }

  /**
   * Show appropriate error toast based on error type
   */
  private showErrorToast(
    error: Error,
    errorType: string,
    recoveryActions: RecoveryAction[]
  ): void {
    const getLanguageText = (arabicText: string, englishText: string) => {
      const isArabic = document.dir === 'rtl' || document.documentElement.lang === 'ar';
      return isArabic ? arabicText : englishText;
    };

    switch (errorType) {
      case 'network':
        toast.networkError({
          action: recoveryActions.length > 0 ? {
            label: getLanguageText(recoveryActions[0].labelAr, recoveryActions[0].label),
            onClick: recoveryActions[0].action
          } : undefined
        });
        break;
        
      case 'auth':
        toast.errorAr(
          'انتهت صلاحية الجلسة',
          'Session expired',
          'يرجى تسجيل الدخول مرة أخرى',
          'Please log in again',
          {
            action: {
              label: getLanguageText('تسجيل الدخول', 'Login'),
              onClick: () => window.location.href = '/auth/login'
            }
          }
        );
        break;
        
      case 'permission':
        toast.errorAr(
          'ليس لديك صلاحية',
          'Permission denied',
          'ليس لديك الصلاحية اللازمة لهذا الإجراء',
          'You do not have permission for this action'
        );
        break;
        
      case 'validation':
        toast.validationError(error.message);
        break;
        
      case 'server':
        toast.errorAr(
          'خطأ في الخادم',
          'Server error',
          'حدث خطأ في الخادم. يرجى المحاولة لاحقاً',
          'A server error occurred. Please try again later',
          {
            action: recoveryActions.length > 0 ? {
              label: getLanguageText(recoveryActions[0].labelAr, recoveryActions[0].label),
              onClick: recoveryActions[0].action
            } : undefined
          }
        );
        break;
        
      default:
        toast.errorAr(
          'حدث خطأ',
          'An error occurred',
          error.message,
          error.message,
          {
            action: recoveryActions.length > 0 ? {
              label: getLanguageText(recoveryActions[0].labelAr, recoveryActions[0].label),
              onClick: recoveryActions[0].action
            } : undefined
          }
        );
    }
  }

  /**
   * Clear retry attempts for a specific context
   */
  clearRetryAttempts(context: ErrorContext): void {
    const retryKey = this.getRetryKey(context);
    this.retryAttempts.delete(retryKey);
  }

  /**
   * Get current retry count for a context
   */
  getRetryCount(context: ErrorContext): number {
    const retryKey = this.getRetryKey(context);
    return this.retryAttempts.get(retryKey) || 0;
  }

  /**
   * Create a recovery action for common scenarios
   */
  static createRecoveryAction(
    type: 'retry' | 'reload' | 'goHome' | 'contact',
    customAction?: () => void | Promise<void>
  ): RecoveryAction {
    switch (type) {
      case 'retry':
        return {
          label: 'Try Again',
          labelAr: 'إعادة المحاولة',
          action: customAction || (() => window.location.reload()),
          variant: 'primary'
        };
        
      case 'reload':
        return {
          label: 'Reload Page',
          labelAr: 'إعادة تحميل الصفحة',
          action: () => window.location.reload(),
          variant: 'secondary'
        };
        
      case 'goHome':
        return {
          label: 'Go to Dashboard',
          labelAr: 'العودة للرئيسية',
          action: () => window.location.href = '/dashboard',
          variant: 'secondary'
        };
        
      case 'contact':
        return {
          label: 'Contact Support',
          labelAr: 'اتصل بالدعم',
          action: () => window.location.href = 'mailto:support@example.com',
          variant: 'secondary'
        };
        
      default:
        throw new Error(`Unknown recovery action type: ${type}`);
    }
  }
}

// Create singleton instance
export const errorRecovery = new ErrorRecoveryService();

// Convenience functions for common error scenarios
export const handleApiError = async (
  error: Error,
  context: ErrorContext,
  retryFn?: () => Promise<void>
) => {
  const recoveryActions: RecoveryAction[] = [];
  
  if (retryFn) {
    recoveryActions.push({
      label: 'Try Again',
      labelAr: 'إعادة المحاولة',
      action: retryFn,
      variant: 'primary'
    });
  }
  
  recoveryActions.push(ErrorRecoveryService.createRecoveryAction('goHome'));
  
  await errorRecovery.handleError(error, {
    context: { ...context, action: 'api_call' },
    autoRetry: true,
    maxRetries: 2,
    recoveryActions
  });
};

export const handleFormError = async (
  error: Error,
  context: ErrorContext,
  resetForm?: () => void
) => {
  const recoveryActions: RecoveryAction[] = [];
  
  if (resetForm) {
    recoveryActions.push({
      label: 'Reset Form',
      labelAr: 'إعادة تعيين النموذج',
      action: resetForm,
      variant: 'secondary'
    });
  }
  
  await errorRecovery.handleError(error, {
    context: { ...context, action: 'form_submission' },
    autoRetry: false,
    recoveryActions
  });
};

export const handleNavigationError = async (
  error: Error,
  context: ErrorContext
) => {
  await errorRecovery.handleError(error, {
    context: { ...context, action: 'navigation' },
    autoRetry: false,
    recoveryActions: [
      ErrorRecoveryService.createRecoveryAction('goHome'),
      ErrorRecoveryService.createRecoveryAction('reload')
    ]
  });
}; 