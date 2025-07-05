
import { toast } from 'sonner';
import { ZodError } from 'zod';
import { formatValidationErrors as formatErrorsRecord } from '@/lib/api/error-handlers';

/**
 * Unified toast notification utilities to ensure consistent messaging throughout the application
 */

type ToastOptions = {
  duration?: number;
  id?: string;
  actionLabel?: string;
  onAction?: () => void;
};

/**
 * Display a success toast notification
 * @param title The success title to display
 * @param description Optional additional details
 * @param options Additional toast options
 */
export function showSuccessToast(
  title: string, 
  description?: string,
  options?: ToastOptions
): void {
  toast.success(title, {
    description,
    duration: options?.duration || 4000,
    id: options?.id,
    action: options?.actionLabel ? {
      label: options.actionLabel,
      onClick: options.onAction || (() => {}),
    } : undefined,
  });
}

/**
 * Display an error toast notification with intelligent error extraction
 * @param error The error object or message
 * @param title Optional title for the error toast
 * @param options Additional toast options
 */
export function showErrorToast(
  error: unknown, 
  title = "Error", 
  options?: ToastOptions
): void {
  let description: string | undefined;
  
  if (error instanceof Error) {
    description = error.message;
  } else if (error instanceof ZodError) {
    // Format ZodError into a readable string
    description = error.errors
      .map(err => {
        const path = err.path.join('.') || 'form';
        return `${path}: ${err.message}`;
      })
      .join('\n');
  } else if (typeof error === 'string') {
    description = error;
  } else if (isObjectWithMessage(error)) {
    description = error.message;
  } else {
    description = 'An unexpected error occurred';
  }
  
  toast.error(title, {
    description,
    duration: options?.duration || 5000,
    id: options?.id,
    action: options?.actionLabel ? {
      label: options.actionLabel,
      onClick: options.onAction || (() => {}),
    } : undefined,
  });
}

/**
 * Display a warning toast notification
 * @param title The warning title to display
 * @param description Optional additional details
 * @param options Additional toast options
 */
export function showWarningToast(
  title: string, 
  description?: string,
  options?: ToastOptions
): void {
  toast.warning(title, {
    description,
    duration: options?.duration || 5000,
    id: options?.id,
    action: options?.actionLabel ? {
      label: options.actionLabel,
      onClick: options.onAction || (() => {}),
    } : undefined,
  });
}

/**
 * Display an info toast notification
 * @param title The info title to display
 * @param description Optional additional details
 * @param options Additional toast options
 */
export function showInfoToast(
  title: string, 
  description?: string,
  options?: ToastOptions
): void {
  toast.info(title, {
    description,
    duration: options?.duration || 4000,
    id: options?.id,
    action: options?.actionLabel ? {
      label: options.actionLabel,
      onClick: options.onAction || (() => {}),
    } : undefined,
  });
}

/**
 * Display an offline toast notification
 */
export function showOfflineToast(): void {
  toast.error('You are offline', {
    description: 'Some features may be unavailable until you reconnect.',
    duration: Infinity,
    id: 'offline-toast',
    action: {
      label: 'Retry',
      onClick: () => {
        if (navigator.onLine) {
          toast.dismiss('offline-toast');
          showSuccessToast('Back online', 'Your connection has been restored.');
        }
      },
    },
  });
}

/**
 * Dismiss a toast by ID
 * @param id The ID of the toast to dismiss
 */
export function dismissToast(id: string): void {
  toast.dismiss(id);
}

/**
 * Type guard for objects with a message property
 */
function isObjectWithMessage(obj: unknown): obj is { message: string } {
  return (
    typeof obj === 'object' && 
    obj !== null && 
    'message' in obj && 
    typeof (obj as any).message === 'string'
  );
}

/**
 * Format validation errors into a readable string
 * @param errors Record of validation errors
 */
export function formatValidationErrors(errors: Record<string, string[]>): string {
  return Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('\n');
}
