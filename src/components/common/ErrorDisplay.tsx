import React from 'react';
import { AppError, ErrorSeverity } from '@/types/error.types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertCircle, 
  RefreshCw, 
  Home, 
  ArrowLeft, 
  Info, 
  AlertTriangle, 
  XCircle,
  Shield
} from 'lucide-react';

interface ErrorDisplayProps {
  error: AppError | Error | string | null;
  title?: string;
  description?: string;
  variant?: 'alert' | 'card' | 'minimal';
  showRetry?: boolean;
  showHome?: boolean;
  showBack?: boolean;
  onRetry?: () => void;
  onHome?: () => void;
  onBack?: () => void;
  className?: string;
}

/**
 * مكون موحد لعرض الأخطاء
 */
export function ErrorDisplay({
  error,
  title,
  description,
  variant = 'alert',
  showRetry = false,
  showHome = false,
  showBack = false,
  onRetry,
  onHome,
  onBack,
  className = ''
}: ErrorDisplayProps) {
  // إذا لم يكن هناك خطأ، لا نعرض شيء
  if (!error) {
    return null;
  }

  // تحويل الخطأ إلى AppError
  const appError = normalizeError(error);

  // الحصول على أيقونة الخطأ
  const getErrorIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'medium':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  // الحصول على متغير التنبيه
  const getAlertVariant = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'destructive';
      default:
        return 'default';
    }
  };

  // تحديد العنوان المناسب
  const getTitle = () => {
    if (title) return title;
    
    switch (appError.severity) {
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
  };

  // تحديد الوصف المناسب
  const getDescription = () => {
    if (description) return description;
    return appError.message || 'حدث خطأ غير متوقع';
  };

  // معالجات الأحداث
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  const handleHome = () => {
    if (onHome) {
      onHome();
    } else {
      window.location.href = '/';
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  // عرض الأزرار
  const renderActions = () => {
    if (!showRetry && !showHome && !showBack) {
      return null;
    }

    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {showRetry && (
          <Button 
            onClick={handleRetry} 
            size="sm" 
            variant="outline"
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            إعادة المحاولة
          </Button>
        )}
        
        {showHome && (
          <Button 
            onClick={handleHome} 
            size="sm" 
            variant="outline"
            className="flex items-center gap-1"
          >
            <Home className="h-4 w-4" />
            الرئيسية
          </Button>
        )}
        
        {showBack && (
          <Button 
            onClick={handleBack} 
            size="sm" 
            variant="outline"
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            رجوع
          </Button>
        )}
      </div>
    );
  };

  // عرض التفاصيل في بيئة التطوير
  const renderDevelopmentDetails = () => {
    if (process.env.NODE_ENV !== 'development' || !appError.details) {
      return null;
    }

    return (
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <h4 className="text-sm font-medium mb-2">تفاصيل الخطأ (بيئة التطوير):</h4>
        <pre className="text-xs overflow-auto max-h-32 whitespace-pre-wrap">
          {JSON.stringify(appError.details, null, 2)}
        </pre>
      </div>
    );
  };

  // عرض معلومات إضافية
  const renderAdditionalInfo = () => {
    return (
      <div className="mt-3 text-sm text-gray-500">
        <p>رقم الخطأ: {appError.code}</p>
        {appError.retryable && (
          <p className="flex items-center gap-1 mt-1">
            <Shield className="h-3 w-3" />
            يمكن إعادة المحاولة
          </p>
        )}
      </div>
    );
  };

  // العرض حسب النوع
  switch (variant) {
    case 'card':
      return (
        <Card className={`border-l-4 ${
          appError.severity === 'critical' || appError.severity === 'high' 
            ? 'border-l-red-500' 
            : appError.severity === 'medium' 
              ? 'border-l-yellow-500' 
              : 'border-l-blue-500'
        } ${className}`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              {getErrorIcon(appError.severity || 'medium')}
              {getTitle()}
            </CardTitle>
            <CardDescription>
              {getDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderAdditionalInfo()}
            {renderDevelopmentDetails()}
            {renderActions()}
          </CardContent>
        </Card>
      );

    case 'minimal':
      return (
        <div className={`flex items-center gap-2 p-3 rounded-md ${
          appError.severity === 'critical' || appError.severity === 'high' 
            ? 'bg-red-50 text-red-700' 
            : appError.severity === 'medium' 
              ? 'bg-yellow-50 text-yellow-700' 
              : 'bg-blue-50 text-blue-700'
        } ${className}`}>
          {getErrorIcon(appError.severity || 'medium')}
          <span className="flex-1 text-sm">{getDescription()}</span>
          {showRetry && (
            <Button 
              onClick={handleRetry} 
              size="sm" 
              variant="ghost"
              className="h-6 px-2"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
        </div>
      );

    default: // 'alert'
      return (
        <Alert 
          variant={getAlertVariant(appError.severity || 'medium')}
          className={className}
        >
          <div className="flex items-center gap-2">
            {getErrorIcon(appError.severity || 'medium')}
            <AlertTitle>{getTitle()}</AlertTitle>
          </div>
          <AlertDescription className="mt-2">
            {getDescription()}
            {renderAdditionalInfo()}
            {renderDevelopmentDetails()}
            {renderActions()}
          </AlertDescription>
        </Alert>
      );
  }
}

/**
 * تحويل أي نوع خطأ إلى AppError
 */
function normalizeError(error: AppError | Error | string): AppError {
  if (typeof error === 'string') {
    return {
      code: 'UNKNOWN_ERROR',
      message: error,
      severity: 'medium',
      retryable: false
    };
  }

  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      severity: 'medium',
      retryable: false,
      details: {
        name: error.name,
        stack: error.stack
      }
    };
  }

  // إذا كان AppError بالفعل
  return error;
}

/**
 * مكون مخصص لعرض قائمة بالأخطاء
 */
export function ErrorList({ 
  errors, 
  className = '' 
}: { 
  errors: (AppError | Error | string)[], 
  className?: string 
}) {
  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {errors.map((error, index) => (
        <ErrorDisplay
          key={index}
          error={error}
          variant="minimal"
        />
      ))}
    </div>
  );
}

/**
 * مكون مخصص لعرض أخطاء النماذج
 */
export function FormErrorDisplay({ 
  fieldErrors, 
  className = '' 
}: { 
  fieldErrors: Record<string, string[]>, 
  className?: string 
}) {
  const allErrors = Object.entries(fieldErrors).flatMap(([field, errors]) =>
    errors.map(error => `${field}: ${error}`)
  );

  if (allErrors.length === 0) {
    return null;
  }

  return (
    <ErrorList 
      errors={allErrors}
      className={className}
    />
  );
} 