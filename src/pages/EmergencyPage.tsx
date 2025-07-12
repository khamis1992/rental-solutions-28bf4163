import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertCircle, RefreshCw, ShieldAlert, AlertTriangle, CheckCircle, Zap, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Import emergency utilities
const emergencyReset = async () => {
  try {
    // Clear all localStorage
    localStorage.clear();
    
    // Clear all sessionStorage
    sessionStorage.clear();
    
    // Clear service worker cache
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }
    
    // Clear browser cache if possible
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    }
    
    toast.success('تم إعادة تعيين النظام بنجاح');
    
    // Force reload
    setTimeout(() => {
      window.location.href = '/auth/login';
      window.location.reload();
    }, 1000);
    
  } catch (error) {
    console.error('Emergency reset failed:', error);
    toast.error('فشل في إعادة التعيين الطارئ');
  }
};

const EmergencyPage: React.FC = () => {
  const [isResetting, setIsResetting] = useState(false);
  const [systemStatus, setSystemStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const navigate = useNavigate();

  React.useEffect(() => {
    // Check system status
    const checkStatus = async () => {
      try {
        // Basic checks
        const hasLocalStorage = typeof localStorage !== 'undefined';
        const hasSessionStorage = typeof sessionStorage !== 'undefined';
        const hasHistory = typeof window.history !== 'undefined';
        
        if (hasLocalStorage && hasSessionStorage && hasHistory) {
          setSystemStatus('ok');
        } else {
          setSystemStatus('error');
        }
      } catch (error) {
        setSystemStatus('error');
      }
    };

    setTimeout(checkStatus, 1000);
  }, []);

  const handleEmergencyReset = async () => {
    setIsResetting(true);
    try {
      await emergencyReset();
    } catch (error) {
      setIsResetting(false);
    }
  };

  const handleSafeMode = () => {
    // Navigate to a safe page
    localStorage.setItem('safeMode', 'true');
    navigate('/dashboard');
    toast.info('تم تفعيل الوضع الآمن');
  };

  const handleClearDarkMode = () => {
    try {
      localStorage.removeItem('theme');
      localStorage.removeItem('darkMode');
      localStorage.removeItem('ui-theme');
      sessionStorage.removeItem('theme');
      
      // Reset theme to light
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      
      toast.success('تم إزالة إعدادات الثيم');
    } catch (error) {
      toast.error('فشل في إزالة إعدادات الثيم');
    }
  };

  const handleNavigateToSettings = () => {
    navigate('/settings');
  };

  const getStatusIcon = () => {
    switch (systemStatus) {
      case 'ok':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'checking':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
    }
  };

  const getStatusBadge = () => {
    switch (systemStatus) {
      case 'ok':
        return <Badge variant="default" className="bg-green-500">سليم</Badge>;
      case 'error':
        return <Badge variant="destructive">خطأ</Badge>;
      case 'checking':
        return <Badge variant="outline">جاري الفحص...</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-red-800">
              <ShieldAlert className="h-6 w-6" />
              صفحة الطوارئ - Emergency Dashboard
              {getStatusIcon()}
            </CardTitle>
            <p className="text-red-600">
              هذه الصفحة مخصصة لحل مشاكل النظام الطارئة وإعادة التعيين الآمنة
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-600">حالة النظام:</span>
              {getStatusBadge()}
            </div>
          </CardContent>
        </Card>

        {/* Emergency Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Critical Actions */}
          <Card className="border-red-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <Zap className="h-5 w-5" />
                إجراءات طارئة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleEmergencyReset}
                disabled={isResetting}
                variant="destructive"
                className="w-full"
                size="lg"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                    جاري إعادة التعيين...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="ml-2 h-4 w-4" />
                    إعادة تعيين طارئة كاملة
                  </>
                )}
              </Button>

              <Separator />

              <Button
                onClick={handleClearDarkMode}
                variant="outline"
                className="w-full"
              >
                <Settings className="ml-2 h-4 w-4" />
                إزالة إعدادات الثيم
              </Button>

              <Button
                onClick={handleSafeMode}
                variant="secondary"
                className="w-full"
              >
                <ShieldAlert className="ml-2 h-4 w-4" />
                تفعيل الوضع الآمن
              </Button>
            </CardContent>
          </Card>

          {/* Safe Actions */}
          <Card className="border-blue-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Settings className="h-5 w-5" />
                إجراءات آمنة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleNavigateToSettings}
                variant="default"
                className="w-full"
              >
                <Settings className="ml-2 h-4 w-4" />
                الذهاب إلى الإعدادات
              </Button>

              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="w-full"
              >
                <CheckCircle className="ml-2 h-4 w-4" />
                العودة إلى الرئيسية
              </Button>

              <Button
                onClick={() => window.location.reload()}
                variant="secondary"
                className="w-full"
              >
                <RefreshCw className="ml-2 h-4 w-4" />
                إعادة تحميل الصفحة
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              معلومات النظام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">تفاصيل المتصفح:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• User Agent: {navigator.userAgent.slice(0, 50)}...</li>
                  <li>• اللغة: {navigator.language}</li>
                  <li>• الاتصال: {navigator.onLine ? 'متصل' : 'غير متصل'}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">حالة التخزين:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• localStorage: {typeof localStorage !== 'undefined' ? '✅ متاح' : '❌ غير متاح'}</li>
                  <li>• sessionStorage: {typeof sessionStorage !== 'undefined' ? '✅ متاح' : '❌ غير متاح'}</li>
                  <li>• Service Worker: {'serviceWorker' in navigator ? '✅ مدعوم' : '❌ غير مدعوم'}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">تعليمات الاستخدام</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-yellow-700 space-y-2">
              <p><strong>إعادة التعيين الطارئة:</strong> تمحو جميع البيانات المحفوظة وتعيد النظام لحالته الأولية</p>
              <p><strong>إزالة إعدادات الثيم:</strong> تحل مشاكل الثيم والدارك مود</p>
              <p><strong>الوضع الآمن:</strong> يشغل النظام بأقل مكونات ممكنة</p>
              <p><strong>ملاحظة:</strong> استخدم هذه الأدوات فقط في حالة وجود مشاكل خطيرة في النظام</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmergencyPage; 