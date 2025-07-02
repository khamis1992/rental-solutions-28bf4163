import React from 'react';
import { AlertTriangle, RefreshCw, Info, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  title?: string;
  message?: string;
  error?: Error | string;
  variant?: 'alert' | 'card' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  showRetry?: boolean;
  showDetails?: boolean;
  onRetry?: () => void;
  onContactSupport?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const getLanguageText = (arabicText: string, englishText: string) => {
  const isArabic = document.dir === 'rtl' || document.documentElement.lang === 'ar';
  return isArabic ? arabicText : englishText;
};

const getErrorMessage = (error: Error | string | undefined): string => {
  if (!error) return '';
  
  if (typeof error === 'string') return error;
  
  // Common error patterns with Arabic translations
  const errorMessage = error.message.toLowerCase();
  
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return getLanguageText(
      'خطأ في الاتصال بالشبكة. تحقق من اتصال الإنترنت.',
      'Network connection error. Check your internet connection.'
    );
  }
  
  if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
    return getLanguageText(
      'انتهت صلاحية جلسة العمل. يرجى تسجيل الدخول مرة أخرى.',
      'Session expired. Please log in again.'
    );
  }
  
  if (errorMessage.includes('forbidden') || errorMessage.includes('403')) {
    return getLanguageText(
      'ليس لديك صلاحية للوصول إلى هذا المورد.',
      'You do not have permission to access this resource.'
    );
  }
  
  if (errorMessage.includes('not found') || errorMessage.includes('404')) {
    return getLanguageText(
      'المورد المطلوب غير موجود.',
      'The requested resource was not found.'
    );
  }
  
  if (errorMessage.includes('server') || errorMessage.includes('500')) {
    return getLanguageText(
      'خطأ في الخادم. يرجى المحاولة لاحقاً.',
      'Server error. Please try again later.'
    );
  }
  
  if (errorMessage.includes('timeout')) {
    return getLanguageText(
      'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.',
      'Request timeout. Please try again.'
    );
  }
  
  if (errorMessage.includes('validation')) {
    return getLanguageText(
      'خطأ في التحقق من البيانات. تحقق من المعلومات المدخلة.',
      'Validation error. Check the entered information.'
    );
  }
  
  // Return original message if no pattern matches
  return error.message;
};

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  error,
  variant = 'alert',
  size = 'md',
  showRetry = false,
  showDetails = false,
  onRetry,
  onContactSupport,
  className,
  children
}) => {
  const isArabic = document.dir === 'rtl' || document.documentElement.lang === 'ar';
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  const defaultTitle = title || getLanguageText('حدث خطأ', 'An error occurred');
  const errorMessage = message || getErrorMessage(error);
  
  const sizeClasses = {
    sm: 'text-sm p-3',
    md: 'text-sm p-4',
    lg: 'text-base p-6'
  };
  
  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const content = (
    <>
      <div className={cn(
        "flex items-start gap-3",
        isArabic && "flex-row-reverse"
      )}>
        <AlertTriangle className={cn(
          "text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5",
          iconSize[size]
        )} />
        
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-medium text-red-800 dark:text-red-200 mb-1",
            isArabic && "text-right"
          )}>
            {defaultTitle}
          </h3>
          
          {errorMessage && (
            <p className={cn(
              "text-red-700 dark:text-red-300 mb-3",
              isArabic && "text-right"
            )}>
              {errorMessage}
            </p>
          )}
          
          {children}
          
          {/* Action buttons */}
          {(showRetry || onContactSupport) && (
            <div className={cn(
              "flex flex-wrap gap-2 mt-3",
              isMobile ? "flex-col" : "flex-row",
              isArabic && "flex-row-reverse"
            )}>
              {showRetry && onRetry && (
                <Button
                  onClick={onRetry}
                  size="sm"
                  variant="outline"
                  className="touch-friendly flex items-center gap-2"
                >
                  <RefreshCw className="w-3 h-3" />
                  {getLanguageText('إعادة المحاولة', 'Try Again')}
                </Button>
              )}
              
              {onContactSupport && (
                <Button
                  onClick={onContactSupport}
                  size="sm"
                  variant="outline"
                  className="touch-friendly flex items-center gap-2"
                >
                  <ExternalLink className="w-3 h-3" />
                  {getLanguageText('اتصل بالدعم', 'Contact Support')}
                </Button>
              )}
            </div>
          )}
          
          {/* Error details for development */}
          {showDetails && error && import.meta.env.MODE === 'development' && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-medium text-red-600 hover:text-red-800">
                <Info className="inline w-3 h-3 mr-1" />
                {getLanguageText('تفاصيل الخطأ', 'Error Details')}
              </summary>
              <div className="mt-2 p-2 bg-red-100 dark:bg-red-900 rounded text-xs">
                <pre className="whitespace-pre-wrap font-mono text-red-800 dark:text-red-200">
                  {typeof error === 'string' ? error : error.stack || error.message}
                </pre>
              </div>
            </details>
          )}
        </div>
      </div>
    </>
  );

  if (variant === 'card') {
    return (
      <Card className={cn("border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900", className)}>
        <CardContent className={sizeClasses[size]}>
          {content}
        </CardContent>
      </Card>
    );
  }
  
  if (variant === 'inline') {
    return (
      <div className={cn(
        "border-l-4 border-red-400 bg-red-50 dark:bg-red-900 dark:border-red-600",
        sizeClasses[size],
        isArabic && "border-l-0 border-r-4",
        className
      )}>
        {content}
      </div>
    );
  }
  
  // Default: alert variant
  return (
    <Alert className={cn(
      "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900",
      className
    )}>
      <AlertDescription className={sizeClasses[size]}>
        {content}
      </AlertDescription>
    </Alert>
  );
};

// Specialized error components for common scenarios
export const NetworkError: React.FC<Omit<ErrorMessageProps, 'title' | 'message'>> = (props) => (
  <ErrorMessage
    title={getLanguageText('خطأ في الاتصال', 'Connection Error')}
    message={getLanguageText(
      'تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت وحاول مرة أخرى.',
      'Unable to connect to server. Check your internet connection and try again.'
    )}
    showRetry
    {...props}
  />
);

export const ValidationError: React.FC<Omit<ErrorMessageProps, 'title'> & { fields?: string[] }> = ({ 
  fields, 
  ...props 
}) => (
  <ErrorMessage
    title={getLanguageText('خطأ في البيانات', 'Validation Error')}
    message={
      fields?.length 
        ? getLanguageText(
            `يرجى تصحيح الحقول التالية: ${fields.join('، ')}`,
            `Please correct the following fields: ${fields.join(', ')}`
          )
        : undefined
    }
    {...props}
  />
);

export const PermissionError: React.FC<Omit<ErrorMessageProps, 'title' | 'message'>> = (props) => (
  <ErrorMessage
    title={getLanguageText('ليس لديك صلاحية', 'Permission Denied')}
    message={getLanguageText(
      'ليس لديك الصلاحية اللازمة لتنفيذ هذا الإجراء.',
      'You do not have the necessary permission to perform this action.'
    )}
    onContactSupport={() => {
      // Default contact support action
      window.location.href = 'mailto:support@example.com';
    }}
    {...props}
  />
);

export const LoadingError: React.FC<Omit<ErrorMessageProps, 'title'>> = (props) => (
  <ErrorMessage
    title={getLanguageText('فشل في التحميل', 'Loading Failed')}
    showRetry
    {...props}
  />
); 