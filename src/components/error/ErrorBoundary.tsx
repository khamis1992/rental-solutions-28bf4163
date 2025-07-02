// @ts-nocheck
/* eslint-disable */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, ArrowLeft } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logError } from '@/services/monitoring';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error with enhanced context
    logError(error, {
      component: 'ErrorBoundary',
      errorInfo,
      errorId: this.state.errorId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });

    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isMobile = window.innerWidth < 768;
      const isArabic = document.dir === 'rtl' || document.documentElement.lang === 'ar';

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir={isArabic ? 'rtl' : 'ltr'}>
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                {isArabic ? 'حدث خطأ غير متوقع' : 'Something went wrong'}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* User-friendly error message */}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className={isArabic ? 'text-right' : 'text-left'}>
                  {isArabic ? (
                    <>
                      <strong>نعتذر عن هذا الخطأ.</strong> حدث خطأ تقني غير متوقع. 
                      يمكنك المحاولة مرة أخرى أو العودة إلى الصفحة الرئيسية.
                    </>
                  ) : (
                    <>
                      <strong>We apologize for this error.</strong> An unexpected technical error occurred. 
                      You can try again or return to the main page.
                    </>
                  )}
                </AlertDescription>
              </Alert>

              {/* Error ID for support */}
              {this.state.errorId && (
                <div className="bg-gray-100 p-3 rounded-md">
                  <p className={`text-sm text-gray-600 ${isArabic ? 'text-right' : 'text-left'}`}>
                    {isArabic ? 'رقم الخطأ للدعم الفني:' : 'Error ID for technical support:'}
                  </p>
                  <code className="text-xs font-mono text-gray-800 bg-white px-2 py-1 rounded">
                    {this.state.errorId}
                  </code>
                </div>
              )}

              {/* Action buttons - mobile optimized */}
              <div className={`flex flex-col ${isMobile ? 'space-y-3' : 'sm:flex-row sm:space-y-0 sm:space-x-3'} ${isArabic ? 'sm:space-x-reverse' : ''}`}>
                <Button 
                  onClick={this.handleRetry}
                  className="touch-friendly flex items-center justify-center gap-2"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4" />
                  {isArabic ? 'المحاولة مرة أخرى' : 'Try Again'}
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  className="touch-friendly flex items-center justify-center gap-2"
                  variant="outline"
                >
                  <Home className="w-4 h-4" />
                  {isArabic ? 'العودة للرئيسية' : 'Go to Dashboard'}
                </Button>
                
                <Button 
                  onClick={this.handleReload}
                  className="touch-friendly flex items-center justify-center gap-2"
                  variant="outline"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {isArabic ? 'إعادة تحميل الصفحة' : 'Reload Page'}
                </Button>
              </div>

              {/* Development mode: Show error details */}
              {import.meta.env.MODE === 'development' && this.state.error && (
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    <Bug className="inline w-4 h-4 mr-1" />
                    {isArabic ? 'تفاصيل الخطأ (للمطورين)' : 'Error Details (Development)'}
                  </summary>
                  <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="text-sm">
                      <p className="font-medium text-red-800 mb-2">Error Message:</p>
                      <p className="text-red-700 mb-4 font-mono text-xs">
                        {this.state.error.message}
                      </p>
                      
                      <p className="font-medium text-red-800 mb-2">Stack Trace:</p>
                      <pre className="text-red-700 font-mono text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                      
                      {this.state.errorInfo && (
                        <>
                          <p className="font-medium text-red-800 mb-2 mt-4">Component Stack:</p>
                          <pre className="text-red-700 font-mono text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </>
                      )}
                    </div>
                  </div>
                </details>
              )}

              {/* Help text */}
              <div className={`text-center text-sm text-gray-500 ${isArabic ? 'text-right' : 'text-left'}`}>
                {isArabic ? (
                  <>
                    إذا استمر هذا الخطأ، يرجى التواصل مع الدعم الفني وتقديم رقم الخطأ أعلاه.
                  </>
                ) : (
                  <>
                    If this error persists, please contact technical support with the error ID above.
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorFallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={errorFallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Lightweight error fallback for smaller components
export const ErrorFallback: React.FC<{
  error?: Error;
  resetError?: () => void;
  message?: string;
}> = ({ error, resetError, message }) => {
  const isArabic = document.dir === 'rtl' || document.documentElement.lang === 'ar';
  
  return (
    <div className="p-4 border border-red-200 bg-red-50 rounded-md">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-red-600" />
        <h3 className="text-sm font-medium text-red-800">
          {isArabic ? 'حدث خطأ' : 'Error occurred'}
        </h3>
      </div>
      <p className="text-sm text-red-700 mb-3">
        {message || (isArabic ? 'فشل في تحميل هذا المكون' : 'Failed to load this component')}
      </p>
      {resetError && (
        <Button 
          onClick={resetError} 
          size="sm" 
          variant="outline"
          className="touch-friendly"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          {isArabic ? 'إعادة المحاولة' : 'Try again'}
        </Button>
      )}
    </div>
  );
}; 