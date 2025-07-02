import React, { useState, useEffect } from 'react';
import { Smartphone, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const isInStandaloneMode = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

const isAndroid = () => {
  return /Android/.test(navigator.userAgent);
};

const isMobile = () => {
  return /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const PWAStatus: React.FC = () => {
  const [installStatus, setInstallStatus] = useState<{
    isInstalled: boolean;
    canInstall: boolean;
    isServiceWorkerReady: boolean;
    platform: string;
  }>({
    isInstalled: false,
    canInstall: false,
    isServiceWorkerReady: false,
    platform: 'unknown'
  });

  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const checkPWAStatus = async () => {
      const isInstalled = isInStandaloneMode();
      const canInstall = !isInstalled && isMobile();
      const isServiceWorkerReady = 'serviceWorker' in navigator && 
        (await navigator.serviceWorker.getRegistration()) !== undefined;
      
      let platform = 'desktop';
      if (isIOS()) platform = 'ios';
      else if (isAndroid()) platform = 'android';
      else if (isMobile()) platform = 'mobile';

      setInstallStatus({
        isInstalled,
        canInstall,
        isServiceWorkerReady,
        platform
      });
    };

    checkPWAStatus();

    // Listen for app installation
    const handleAppInstalled = () => {
      setInstallStatus(prev => ({ ...prev, isInstalled: true, canInstall: false }));
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, []);

  const getInstallInstructions = () => {
    switch (installStatus.platform) {
      case 'ios':
        return [
          'اضغط على زر المشاركة (السهم للأعلى) في أسفل الشاشة',
          'مرر لأسفل واختر "إضافة إلى الشاشة الرئيسية"',
          'اضغط "إضافة" لتثبيت التطبيق'
        ];
      case 'android':
        return [
          'اضغط على قائمة المتصفح (النقاط الثلاث)',
          'اختر "إضافة إلى الشاشة الرئيسية" أو "تثبيت التطبيق"',
          'اضغط "إضافة" أو "تثبيت" لإكمال العملية'
        ];
      default:
        return [
          'ابحث عن خيار "إضافة إلى الشاشة الرئيسية" في متصفحك',
          'أو ابحث عن أيقونة التثبيت في شريط العنوان',
          'اتبع التعليمات لتثبيت التطبيق'
        ];
    }
  };

  const handleManualInstall = () => {
    setShowInstructions(true);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (installStatus.isInstalled) {
    return (
      <Card className="w-full max-w-md mx-auto" dir="rtl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-green-700">التطبيق مثبت بنجاح!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            يعمل التطبيق الآن كتطبيق أصلي على جهازك
          </p>
          <div className="space-y-2 text-xs text-gray-500">
            <div>✅ يعمل بدون إنترنت</div>
            <div>✅ يحفظ البيانات محلياً</div>
            <div>✅ يرسل إشعارات</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!installStatus.canInstall) {
    return (
      <Card className="w-full max-w-md mx-auto" dir="rtl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="bg-blue-100 p-3 rounded-full">
              <Smartphone className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-blue-700">تطبيق الويب التقدمي</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            {installStatus.platform === 'desktop' 
              ? 'استخدم هذا التطبيق على جهاز محمول للحصول على تجربة كاملة'
              : 'التطبيق جاهز للاستخدام في متصفحك'
            }
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto" dir="rtl">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <div className="bg-yellow-100 p-3 rounded-full">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
        <CardTitle className="text-yellow-700">تثبيت التطبيق</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4 text-center">
          يمكنك تثبيت هذا التطبيق على جهازك للحصول على تجربة أفضل
        </p>

        {!installStatus.isServiceWorkerReady && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-red-700 text-center">
              ⚠️ الخدمة الخلفية غير جاهزة. قد تحتاج لإعادة تحميل الصفحة.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Button 
            onClick={handleManualInstall} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Smartphone className="w-4 h-4 ml-2" />
            عرض تعليمات التثبيت
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            إعادة تحميل
          </Button>
        </div>

        {showInstructions && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-3 text-right">
              تعليمات التثبيت:
            </h4>
            <ol className="space-y-2 text-sm text-blue-700">
              {getInstallInstructions().map((instruction, index) => (
                <li key={index} className="flex items-start gap-2 text-right">
                  <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">
                    {index + 1}
                  </span>
                  {instruction}
                </li>
              ))}
            </ol>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowInstructions(false)}
              className="w-full mt-3 text-blue-600"
            >
              إخفاء التعليمات
            </Button>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 text-center">
          النظام: {installStatus.platform} | 
          الخدمة: {installStatus.isServiceWorkerReady ? 'جاهزة' : 'غير جاهزة'}
        </div>
      </CardContent>
    </Card>
  );
}; 