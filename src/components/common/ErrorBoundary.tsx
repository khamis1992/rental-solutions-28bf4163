import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppError, ErrorSeverity } from '@/types/error.types';
import { errorLogger } from '@/lib/errors/error-logger';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  showRetry?: boolean;
  showHome?: boolean;
  showBack?: boolean;
  context?: Record<string, any>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

/**
 * Error Boundary موحد لالتقاط ومعالجة أخطاء React
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // تحويل الخطأ إلى AppError
    const appError: AppError = {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'خطأ غير متوقع في التطبيق',
      severity: 'high',
      retryable: true,
      details: {
        name: error.name,
        stack: error.stack
      }
    };

    return {
      hasError: true,
      error: appError
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // تسجيل الخطأ
    const appError: AppError = {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'خطأ غير متوقع في التطبيق',
      severity: 'high',
      retryable: true,
      details: {
        name: error.name,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      }
    };

    // تسجيل الخطأ في النظام
    errorLogger.logError(error, 'high', {
      source: 'ErrorBoundary',
      operation: 'componentDidCatch',
      details: {
        errorInfo,
        context: this.props.context
      }
    });

    this.setState({
      error: appError,
      errorInfo
    });

    // تشغيل معالج الخطأ المخصص إذا كان موجوداً
    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    }
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleGoBack = () => {
    window.history.back();
  };

  private getErrorSeverityIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-6 w-6 text-red-600" />;
      case 'high':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      case 'medium':
        return <AlertCircle className="h-6 w-6 text-yellow-500" />;
      case 'low':
        return <AlertCircle className="h-6 w-6 text-blue-500" />;
      default:
        return <AlertCircle className="h-6 w-6 text-gray-500" />;
    }
  };

  private getErrorSeverityVariant = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'destructive';
      default:
        return 'default';
    }
  };

  render() {
    if (this.state.hasError) {
      // إذا كان هناك fallback مخصص
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error } = this.state;
      const canRetry = this.state.retryCount < this.maxRetries && error?.retryable;

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert variant={this.getErrorSeverityVariant(error?.severity || 'medium')}>
              <div className="flex items-center gap-2">
                {this.getErrorSeverityIcon(error?.severity || 'medium')}
                <AlertTitle>حدث خطأ في التطبيق</AlertTitle>
              </div>
              <AlertDescription className="mt-2">
                {error?.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'}
              </AlertDescription>
            </Alert>

            {/* تفاصيل الخطأ في بيئة التطوير */}
            {process.env.NODE_ENV === 'development' && error?.details && (
              <Alert>
                <AlertTitle>تفاصيل الخطأ (بيئة التطوير)</AlertTitle>
                <AlertDescription>
                  <pre className="text-xs mt-2 whitespace-pre-wrap">
                    {JSON.stringify(error.details, null, 2)}
                  </pre>
                </AlertDescription>
              </Alert>
            )}

            {/* أزرار الإجراءات */}
            <div className="flex flex-col gap-2">
              {canRetry && this.props.showRetry !== false && (
                <Button onClick={this.handleRetry} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  إعادة المحاولة ({this.maxRetries - this.state.retryCount} متبقية)
                </Button>
              )}

              {this.props.showHome !== false && (
                <Button onClick={this.handleGoHome} variant="outline" className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  الذهاب للصفحة الرئيسية
                </Button>
              )}

              {this.props.showBack !== false && (
                <Button onClick={this.handleGoBack} variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  الرجوع للصفحة السابقة
                </Button>
              )}
            </div>

            {/* معلومات إضافية */}
            <div className="text-center text-sm text-gray-500">
              <p>
                إذا استمر الخطأ، يرجى الاتصال بالدعم الفني
              </p>
              <p className="mt-1">
                رقم الخطأ: {error?.code || 'UNKNOWN'}
              </p>
              {this.state.retryCount >= this.maxRetries && error?.retryable && (
                <p className="mt-1 text-red-500">
                  تم استنفاد عدد المحاولات المسموح به
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC لتغليف المكونات بـ Error Boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook للوصول إلى معلومات Error Boundary
 */
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const throwError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { throwError, resetError };
} 