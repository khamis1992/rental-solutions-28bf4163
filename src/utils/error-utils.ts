import { AppError, ErrorCode, ErrorSeverity, createServiceError } from '@/types/error.types';
import { handleError } from '@/lib/errors/error-handler';
import { toast } from '@/hooks/use-toast';
import { ApiResponse } from '@/types/api.types';

/**
 * أنماط معالجة الأخطاء المختلفة
 */
export enum ErrorHandlingPattern {
  SILENT = 'silent',           // لا تظهر أي رسائل للمستخدم
  TOAST_ONLY = 'toast_only',   // اظهر toast فقط
  CONSOLE_ONLY = 'console_only', // اطبع في console فقط
  FULL = 'full'                // معالجة كاملة (toast + console + logging)
}

/**
 * إعدادات معالجة الأخطاء
 */
export interface ErrorHandlingConfig {
  pattern: ErrorHandlingPattern;
  context?: Record<string, any>;
  customMessage?: string;
  severity?: ErrorSeverity;
  retryable?: boolean;
  showRetryButton?: boolean;
  onRetry?: () => void;
}

/**
 * دالة موحدة لمعالجة الأخطاء حسب النمط المحدد
 */
export async function handleErrorWithPattern(
  error: unknown,
  config: ErrorHandlingConfig = { pattern: ErrorHandlingPattern.FULL }
): Promise<void> {
  const {
    pattern,
    context = {},
    customMessage,
    severity = 'medium',
    retryable = false,
    showRetryButton = false,
    onRetry
  } = config;

  // تحويل الخطأ إلى AppError
  let appError: AppError;
  
  if (typeof error === 'string') {
    appError = createServiceError(customMessage || error, { 
      originalError: error,
      ...context 
    });
  } else if (error instanceof Error) {
    appError = createServiceError(customMessage || error.message, {
      name: error.name,
      stack: error.stack,
      originalError: error,
      ...context
    });
  } else if (error && typeof error === 'object' && 'code' in error) {
    appError = error as AppError;
  } else {
    appError = createServiceError(customMessage || 'خطأ غير معروف', {
      originalError: error,
      ...context
    });
  }

  // تحديث خصائص الخطأ
  appError.severity = severity;
  appError.retryable = retryable;

  // معالجة الخطأ حسب النمط
  switch (pattern) {
    case ErrorHandlingPattern.SILENT:
      // لا تفعل شيء
      break;

    case ErrorHandlingPattern.CONSOLE_ONLY:
      console.error('Error:', appError);
      break;

    case ErrorHandlingPattern.TOAST_ONLY:
      toast({
        title: getErrorTitle(appError.severity),
        description: appError.message,
        variant: appError.severity === 'critical' || appError.severity === 'high' ? 'destructive' : 'default',
        action: showRetryButton && onRetry ? (
          <button onClick={onRetry} className="text-sm underline">
            إعادة المحاولة
          </button>
        ) : undefined
      });
      break;

    case ErrorHandlingPattern.FULL:
    default:
      await handleError(appError, {
        showToast: true,
        logError: true,
        context
      });
      break;
  }
}

/**
 * wrapper للعمليات غير المتزامنة مع معالجة الأخطاء
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  config: ErrorHandlingConfig = { pattern: ErrorHandlingPattern.FULL }
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    await handleErrorWithPattern(error, config);
    return null;
  }
}

/**
 * wrapper للعمليات المتزامنة مع معالجة الأخطاء
 */
export function withSyncErrorHandling<T>(
  operation: () => T,
  config: ErrorHandlingConfig = { pattern: ErrorHandlingPattern.FULL }
): T | null {
  try {
    return operation();
  } catch (error) {
    handleErrorWithPattern(error, config);
    return null;
  }
}

/**
 * معالج أخطاء API مع إرجاع ApiResponse
 */
export async function handleApiError<T>(
  error: unknown,
  config: ErrorHandlingConfig = { pattern: ErrorHandlingPattern.FULL }
): Promise<ApiResponse<T>> {
  await handleErrorWithPattern(error, config);
  
  const appError = normalizeToAppError(error, config.customMessage);
  
  return {
    success: false,
    data: null,
    error: appError
  };
}

/**
 * معالج أخطاء النماذج مع إرجاع أخطاء الحقول
 */
export function handleFormError(
  error: unknown,
  config: ErrorHandlingConfig = { pattern: ErrorHandlingPattern.TOAST_ONLY }
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
  handleErrorWithPattern(error, config);
  
  return {
    form: [normalizeToAppError(error, config.customMessage).message]
  };
}

/**
 * معالج أخطاء التحقق من الصحة
 */
export function handleValidationError(
  validationErrors: Record<string, string[]>,
  config: ErrorHandlingConfig = { pattern: ErrorHandlingPattern.TOAST_ONLY }
): void {
  const errorMessages = Object.entries(validationErrors)
    .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
    .join('\n');

  const appError = createServiceError(config.customMessage || 'خطأ في التحقق من البيانات', {
    validationErrors,
    field: Object.keys(validationErrors)[0]
  });

  handleErrorWithPattern(appError, {
    ...config,
    severity: 'medium'
  });
}

/**
 * معالج أخطاء الشبكة
 */
export function handleNetworkError(
  error: unknown,
  config: ErrorHandlingConfig = { pattern: ErrorHandlingPattern.FULL }
): void {
  const networkError = createServiceError(
    config.customMessage || 'خطأ في الاتصال بالشبكة',
    {
      type: 'network',
      originalError: error,
      retryable: true
    }
  );

  handleErrorWithPattern(networkError, {
    ...config,
    severity: 'medium',
    retryable: true
  });
}

/**
 * معالج أخطاء المصادقة
 */
export function handleAuthError(
  error: unknown,
  config: ErrorHandlingConfig = { pattern: ErrorHandlingPattern.FULL }
): void {
  const authError = createServiceError(
    config.customMessage || 'خطأ في المصادقة',
    {
      type: 'authentication',
      originalError: error
    }
  );

  handleErrorWithPattern(authError, {
    ...config,
    severity: 'high',
    retryable: false
  });
}

/**
 * معالج أخطاء الصلاحيات
 */
export function handlePermissionError(
  error: unknown,
  config: ErrorHandlingConfig = { pattern: ErrorHandlingPattern.FULL }
): void {
  const permissionError = createServiceError(
    config.customMessage || 'ليس لديك صلاحية للوصول إلى هذا المورد',
    {
      type: 'authorization',
      originalError: error
    }
  );

  handleErrorWithPattern(permissionError, {
    ...config,
    severity: 'high',
    retryable: false
  });
}

/**
 * تحويل أي خطأ إلى AppError
 */
function normalizeToAppError(error: unknown, customMessage?: string): AppError {
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
 * الحصول على عنوان الخطأ حسب الشدة
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
 * التحقق من إمكانية إعادة المحاولة
 */
export function isRetryableError(error: AppError): boolean {
  return error.retryable === true || 
         error.code === 'NETWORK_ERROR' ||
         error.code === 'TIMEOUT_ERROR' ||
         error.code === 'SERVICE_ERROR';
}

/**
 * الحصول على رسالة خطأ مبسطة للمستخدم
 */
export function getSimplifiedErrorMessage(error: AppError): string {
  switch (error.code) {
    case 'VALIDATION_ERROR':
      return 'يرجى التحقق من البيانات المدخلة';
    case 'AUTHENTICATION_ERROR':
      return 'يرجى تسجيل الدخول مرة أخرى';
    case 'AUTHORIZATION_ERROR':
      return 'ليس لديك صلاحية للوصول';
    case 'NOT_FOUND_ERROR':
      return 'المورد المطلوب غير موجود';
    case 'DATABASE_ERROR':
      return 'خطأ في قاعدة البيانات';
    case 'NETWORK_ERROR':
      return 'خطأ في الاتصال بالشبكة';
    case 'TIMEOUT_ERROR':
      return 'انتهت مهلة الانتظار';
    case 'RATE_LIMIT_ERROR':
      return 'تم تجاوز الحد المسموح من الطلبات';
    case 'PAYMENT_ERROR':
      return 'خطأ في عملية الدفع';
    default:
      return error.message || 'حدث خطأ غير متوقع';
  }
}

/**
 * دالة لإنشاء معالج أخطاء مخصص
 */
export function createErrorHandler(
  defaultConfig: ErrorHandlingConfig
) {
  return {
    handle: (error: unknown, config?: Partial<ErrorHandlingConfig>) => 
      handleErrorWithPattern(error, { ...defaultConfig, ...config }),
    
    async: <T>(operation: () => Promise<T>, config?: Partial<ErrorHandlingConfig>) => 
      withErrorHandling(operation, { ...defaultConfig, ...config }),
    
    sync: <T>(operation: () => T, config?: Partial<ErrorHandlingConfig>) => 
      withSyncErrorHandling(operation, { ...defaultConfig, ...config }),
    
    api: <T>(error: unknown, config?: Partial<ErrorHandlingConfig>) => 
      handleApiError<T>(error, { ...defaultConfig, ...config }),
    
    form: (error: unknown, config?: Partial<ErrorHandlingConfig>) => 
      handleFormError(error, { ...defaultConfig, ...config })
  };
}

/**
 * معالجات أخطاء جاهزة للاستخدام
 */
export const errorHandlers = {
  // معالج صامت
  silent: createErrorHandler({ pattern: ErrorHandlingPattern.SILENT }),
  
  // معالج toast فقط
  toastOnly: createErrorHandler({ pattern: ErrorHandlingPattern.TOAST_ONLY }),
  
  // معالج console فقط
  consoleOnly: createErrorHandler({ pattern: ErrorHandlingPattern.CONSOLE_ONLY }),
  
  // معالج كامل
  full: createErrorHandler({ pattern: ErrorHandlingPattern.FULL })
}; 