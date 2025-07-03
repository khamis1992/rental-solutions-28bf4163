import { AppError, ErrorSeverity, createServiceError, createNetworkError, createAuthenticationError, createAuthorizationError } from '@/types/error.types';
import { handleError } from '@/lib/errors/error-handler';
import { toast } from '@/hooks/use-toast';
import { ApiResponse } from '@/types/api.types';

/**
 * أنماط معالجة الأخطاء
 */
export enum ErrorPattern {
  SILENT = 'silent',
  TOAST_ONLY = 'toast_only', 
  CONSOLE_ONLY = 'console_only',
  FULL = 'full'
}

/**
 * إعدادات معالجة الأخطاء
 */
export interface ErrorConfig {
  pattern?: ErrorPattern;
  context?: Record<string, any>;
  customMessage?: string;
  severity?: ErrorSeverity;
  showToast?: boolean;
  logError?: boolean;
}

/**
 * دالة موحدة لمعالجة الأخطاء
 */
export async function unifiedErrorHandler(
  error: unknown,
  config: ErrorConfig = {}
): Promise<AppError> {
  const {
    pattern = ErrorPattern.FULL,
    context = {},
    customMessage,
    severity = 'medium',
    showToast = true,
    logError = true
  } = config;

  // تحويل الخطأ إلى AppError
  const appError = normalizeError(error, customMessage);
  appError.severity = severity;

  // معالجة الخطأ حسب النمط
  switch (pattern) {
    case ErrorPattern.SILENT:
      // لا تفعل شيء
      break;

    case ErrorPattern.CONSOLE_ONLY:
      console.error('Error:', appError);
      break;

    case ErrorPattern.TOAST_ONLY:
      if (showToast) {
        toast({
          title: getErrorTitle(severity),
          description: appError.message,
          variant: severity === 'critical' || severity === 'high' ? 'destructive' : 'default'
        });
      }
      break;

    case ErrorPattern.FULL:
    default:
      await handleError(appError, {
        showToast,
        logError,
        context
      });
      break;
  }

  return appError;
}

/**
 * معالج للعمليات غير المتزامنة
 */
export async function handleAsync<T>(
  operation: () => Promise<T>,
  config: ErrorConfig = {}
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    await unifiedErrorHandler(error, config);
    return null;
  }
}

/**
 * معالج لأخطاء API
 */
export async function handleApiError<T>(
  error: unknown,
  config: ErrorConfig = {}
): Promise<ApiResponse<T>> {
  const appError = await unifiedErrorHandler(error, config);
  
  return {
    success: false,
    data: null,
    error: appError
  };
}

/**
 * معالج لأخطاء النماذج
 */
export function handleFormError(
  error: unknown,
  config: ErrorConfig = {}
): Record<string, string[]> {
  // معالجة أخطاء Zod
  if (error && typeof error === 'object' && 'issues' in error) {
    const zodError = error as any;
    const fieldErrors: Record<string, string[]> = {};
    
    zodError.issues?.forEach((issue: any) => {
      const field = issue.path?.join('.') || 'form';
      if (!fieldErrors[field]) {
        fieldErrors[field] = [];
      }
      fieldErrors[field].push(issue.message);
    });
    
    return fieldErrors;
  }

  // معالجة أخطاء عامة
  unifiedErrorHandler(error, config);
  
  return {
    form: [normalizeError(error, config.customMessage).message]
  };
}

/**
 * معالجات أخطاء مخصصة
 */
export const errorHandlers = {
  // معالج الشبكة
  network: (error: unknown, config: ErrorConfig = {}) => 
    unifiedErrorHandler(error, {
      ...config,
      customMessage: config.customMessage || 'خطأ في الاتصال بالشبكة',
      severity: 'medium'
    }),

  // معالج المصادقة
  auth: (error: unknown, config: ErrorConfig = {}) => 
    unifiedErrorHandler(error, {
      ...config,
      customMessage: config.customMessage || 'خطأ في المصادقة',
      severity: 'high'
    }),

  // معالج الصلاحيات
  permission: (error: unknown, config: ErrorConfig = {}) => 
    unifiedErrorHandler(error, {
      ...config,
      customMessage: config.customMessage || 'ليس لديك صلاحية للوصول',
      severity: 'high'
    }),

  // معالج قاعدة البيانات
  database: (error: unknown, config: ErrorConfig = {}) => 
    unifiedErrorHandler(error, {
      ...config,
      customMessage: config.customMessage || 'خطأ في قاعدة البيانات',
      severity: 'high'
    }),

  // معالج التحقق من الصحة
  validation: (error: unknown, config: ErrorConfig = {}) => 
    unifiedErrorHandler(error, {
      ...config,
      customMessage: config.customMessage || 'خطأ في التحقق من البيانات',
      severity: 'medium'
    })
};

/**
 * تحويل أي خطأ إلى AppError
 */
function normalizeError(error: unknown, customMessage?: string): AppError {
  if (typeof error === 'string') {
    return createServiceError(customMessage || error);
  }

  if (error instanceof Error) {
    return createServiceError(customMessage || error.message, {
      name: error.name,
      stack: error.stack
    });
  }

  if (error && typeof error === 'object' && 'code' in error) {
    return error as AppError;
  }

  return createServiceError(customMessage || 'خطأ غير معروف', {
    originalError: error
  });
}

/**
 * الحصول على عنوان الخطأ
 */
function getErrorTitle(severity: ErrorSeverity): string {
  switch (severity) {
    case 'critical':
      return 'خطأ حرج';
    case 'high':
      return 'خطأ مهم';
    case 'medium':
      return 'تحذير';
    case 'low':
      return 'معلومات';
    default:
      return 'خطأ';
  }
}

/**
 * Hook للاستخدام في React Components
 */
export function useUnifiedErrorHandler() {
  const handleError = async (error: unknown, config?: ErrorConfig) => {
    return await unifiedErrorHandler(error, config);
  };

  const handleAsyncOperation = async <T>(
    operation: () => Promise<T>,
    config?: ErrorConfig
  ) => {
    return await handleAsync(operation, config);
  };

  return {
    handleError,
    handleAsyncOperation,
    handleApiError: (error: unknown, config?: ErrorConfig) => handleApiError(error, config),
    handleFormError: (error: unknown, config?: ErrorConfig) => handleFormError(error, config),
    handlers: errorHandlers
  };
} 