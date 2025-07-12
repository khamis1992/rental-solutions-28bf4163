import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RotateCcw, CheckCircle } from 'lucide-react';
import { resetThemeSystem } from '@/utils/theme-utils';

interface ThemeResetButtonProps {
  className?: string;
}

export const ThemeResetButton: React.FC<ThemeResetButtonProps> = ({ className = '' }) => {
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleReset = async () => {
    try {
      setIsResetting(true);
      
      // عرض تأكيد للمستخدم
      const confirmed = window.confirm(
        'هل أنت متأكد من إعادة تعيين إعدادات المظهر؟\n' +
        'سيتم إعادة تعيين المظهر إلى الوضع الافتراضي وإعادة تحميل الصفحة.'
      );
      
      if (confirmed) {
        setShowConfirmation(true);
        
        // إعادة تعيين النظام
        resetThemeSystem();
      }
      
    } catch (error) {
      console.error('Error resetting theme:', error);
      alert('حدث خطأ أثناء إعادة التعيين. يرجى إعادة تحميل الصفحة يدوياً.');
    } finally {
      setIsResetting(false);
    }
  };

  if (showConfirmation) {
    return (
      <Alert className={`border-green-200 bg-green-50 ${className}`}>
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          تم إعادة تعيين المظهر بنجاح. جاري إعادة تحميل الصفحة...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          إذا كان النظام يتعليق بعد تغيير المظهر، استخدم هذا الزر لإعادة التعيين.
        </AlertDescription>
      </Alert>
      
      <Button
        variant="outline"
        onClick={handleReset}
        disabled={isResetting}
        className="w-full flex items-center gap-2"
      >
        <RotateCcw className={`h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
        {isResetting ? 'جاري إعادة التعيين...' : 'إعادة تعيين المظهر'}
      </Button>
      
      <p className="text-xs text-muted-foreground text-center">
        سيتم حذف جميع إعدادات المظهر وإعادة تحميل الصفحة
      </p>
    </div>
  );
};

export default ThemeResetButton; 