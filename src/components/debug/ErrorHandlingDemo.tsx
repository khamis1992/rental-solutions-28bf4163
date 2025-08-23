// @ts-nocheck
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  Wifi, 
  Shield, 
  Server, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ErrorMessage, NetworkError, ValidationError, PermissionError, LoadingError } from '@/components/ui/error-message';
import { errorRecovery, handleApiError, handleFormError } from '@/lib/error-recovery';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

const ErrorHandlingDemo: React.FC = () => {
  const [componentError, setComponentError] = useState<Error | null>(null);
  const isArabic = document.dir === 'rtl' || document.documentElement.lang === 'ar';

  // Simulate different types of errors
  const simulateNetworkError = () => {
    const error = new Error('Network request failed: Unable to connect to server');
    handleApiError(error, { component: 'ErrorHandlingDemo', action: 'network_test' });
  };

  const simulateValidationError = () => {
    toast.validationError('يرجى ملء جميع الحقول المطلوبة / Please fill all required fields');
  };

  const simulateAuthError = () => {
    const error = new Error('Unauthorized: Session expired');
    errorRecovery.handleError(error, {
      context: { component: 'ErrorHandlingDemo', action: 'auth_test' }
    });
  };

  const simulateServerError = () => {
    const error = new Error('Internal server error: Database connection failed');
    errorRecovery.handleError(error, {
      context: { component: 'ErrorHandlingDemo', action: 'server_test' },
      autoRetry: true,
      maxRetries: 2
    });
  };

  const simulateComponentError = () => {
    setComponentError(new Error('Component rendering failed: Invalid props'));
  };

  const showSuccessToast = () => {
    toast.saveSuccess();
  };

  const showWarningToast = () => {
    toast.warningAr(
      'تحذير',
      'Warning',
      'هذا إجراء لا يمكن التراجع عنه',
      'This action cannot be undone'
    );
  };

  const showInfoToast = () => {
    toast.infoAr(
      'معلومات',
      'Information',
      'تم تحديث النظام بنجاح',
      'System has been updated successfully'
    );
  };

  const ErrorComponent: React.FC = () => {
    if (componentError) {
      throw componentError;
    }
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-md">
        <p className="text-green-800">
          {isArabic ? 'هذا المكون يعمل بشكل طبيعي' : 'This component is working normally'}
        </p>
      </div>
    );
  };

  const resetComponentError = () => {
    setComponentError(null);
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            {isArabic ? 'عرض توضيحي لمعالجة الأخطاء' : 'Error Handling Demo'}
          </CardTitle>
          <p className="text-sm text-gray-600">
            {isArabic 
              ? 'اختبر جميع أنواع معالجة الأخطاء والإشعارات المتاحة في النظام'
              : 'Test all types of error handling and notifications available in the system'
            }
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Toast Notifications Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              {isArabic ? 'إشعارات التوست' : 'Toast Notifications'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button 
                onClick={showSuccessToast}
                variant="outline"
                className="touch-friendly flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4 text-green-600" />
                {isArabic ? 'نجاح' : 'Success'}
              </Button>
              
              <Button 
                onClick={simulateValidationError}
                variant="outline"
                className="touch-friendly flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                {isArabic ? 'تحقق' : 'Validation'}
              </Button>
              
              <Button 
                onClick={showWarningToast}
                variant="outline"
                className="touch-friendly flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                {isArabic ? 'تحذير' : 'Warning'}
              </Button>
              
              <Button 
                onClick={showInfoToast}
                variant="outline"
                className="touch-friendly flex items-center gap-2"
              >
                <Info className="w-4 h-4 text-blue-600" />
                {isArabic ? 'معلومات' : 'Info'}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Error Simulation Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              {isArabic ? 'محاكاة الأخطاء' : 'Error Simulation'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button 
                onClick={simulateNetworkError}
                variant="destructive"
                className="touch-friendly flex items-center gap-2"
              >
                <Wifi className="w-4 h-4" />
                {isArabic ? 'خطأ شبكة' : 'Network Error'}
              </Button>
              
              <Button 
                onClick={simulateAuthError}
                variant="destructive"
                className="touch-friendly flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                {isArabic ? 'خطأ مصادقة' : 'Auth Error'}
              </Button>
              
              <Button 
                onClick={simulateServerError}
                variant="destructive"
                className="touch-friendly flex items-center gap-2"
              >
                <Server className="w-4 h-4" />
                {isArabic ? 'خطأ خادم' : 'Server Error'}
              </Button>
              
              <Button 
                onClick={simulateComponentError}
                variant="destructive"
                className="touch-friendly flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                {isArabic ? 'خطأ مكون' : 'Component Error'}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Error Message Components Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              {isArabic ? 'مكونات رسائل الخطأ' : 'Error Message Components'}
            </h3>
            <div className="space-y-4">
              <NetworkError 
                onRetry={() => toast.info('Retrying network request...')}
                variant="alert"
              />
              
              <ValidationError 
                fields={['email', 'password']}
                variant="card"
                size="sm"
              />
              
              <PermissionError 
                variant="inline"
                size="md"
              />
              
              <LoadingError 
                message={isArabic ? 'فشل في تحميل البيانات' : 'Failed to load data'}
                onRetry={() => toast.info('Retrying data load...')}
                variant="alert"
              />
            </div>
          </div>

          <Separator />

          {/* Component Error Boundary Test */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              {isArabic ? 'اختبار حدود الخطأ' : 'Error Boundary Test'}
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button 
                  onClick={resetComponentError}
                  variant="outline"
                  className="touch-friendly"
                >
                  {isArabic ? 'إعادة تعيين' : 'Reset Component'}
                </Button>
                <Badge variant={componentError ? 'destructive' : 'default'}>
                  {componentError 
                    ? (isArabic ? 'خطأ' : 'Error') 
                    : (isArabic ? 'طبيعي' : 'Normal')
                  }
                </Badge>
              </div>
              
              <ErrorBoundary>
                <ErrorComponent />
              </ErrorBoundary>
            </div>
          </div>

          {/* Features List */}
          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="font-medium text-blue-900 mb-2">
              {isArabic ? 'الميزات المطبقة:' : 'Implemented Features:'}
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✅ {isArabic ? 'حدود الخطأ العامة مع دعم العربية' : 'Global Error Boundary with Arabic support'}</li>
              <li>✅ {isArabic ? 'إشعارات محسنة مع RTL' : 'Enhanced Toast notifications with RTL'}</li>
              <li>✅ {isArabic ? 'رسائل خطأ ذكية' : 'Intelligent error messages'}</li>
              <li>✅ {isArabic ? 'آليات الاستعادة التلقائية' : 'Automatic recovery mechanisms'}</li>
              <li>✅ {isArabic ? 'تحسين للأجهزة المحمولة' : 'Mobile optimization'}</li>
              <li>✅ {isArabic ? 'مراقبة الأداء' : 'Performance monitoring'}</li>
              <li>✅ {isArabic ? 'إعادة المحاولة التلقائية' : 'Auto-retry functionality'}</li>
              <li>✅ {isArabic ? 'تسجيل الأخطاء المحسن' : 'Enhanced error logging'}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorHandlingDemo; 