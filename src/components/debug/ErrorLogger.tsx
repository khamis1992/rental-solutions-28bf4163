import { useEffect } from 'react';

export const ErrorLogger = () => {
  useEffect(() => {
    // تسجيل الأخطاء غير المعالجة
    const handleError = (event: ErrorEvent) => {
      console.log('🔍 Error detected:', {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error
      });
    };

    // تسجيل Promise rejections غير المعالجة
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.log('🔍 Unhandled Promise Rejection:', {
        reason: event.reason,
        promise: event.promise
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null; // هذا المكون لا يعرض شيء
}; 