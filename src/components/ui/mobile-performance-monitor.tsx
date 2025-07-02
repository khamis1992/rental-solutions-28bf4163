// @ts-nocheck
/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { Wifi, WifiOff, Smartphone, AlertTriangle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PerformanceStats {
  isOnline: boolean;
  connectionType: string;
  memoryUsage?: {
    used: number;
    total: number;
    percentage: number;
  };
  loadTime: number;
  isSlowConnection: boolean;
}

export function MobilePerformanceMonitor() {
  const [stats, setStats] = useState<PerformanceStats>({
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    loadTime: 0,
    isSlowConnection: false,
  });
  const [showAlert, setShowAlert] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) return;

    const updateStats = () => {
      // @ts-ignore
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      const newStats: PerformanceStats = {
        isOnline: navigator.onLine,
        connectionType: connection?.effectiveType || 'unknown',
        loadTime: performance.now(),
        isSlowConnection: connection ? 
          ['slow-2g', '2g', '3g'].includes(connection.effectiveType) : false,
      };

      // معلومات الذاكرة (Chrome فقط)
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
        newStats.memoryUsage = {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
          percentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100),
        };
      }

      setStats(newStats);

      // إظهار تنبيه للشبكات البطيئة
      if (newStats.isSlowConnection && newStats.isOnline) {
        setShowAlert(true);
      }
    };

    updateStats();

    // مراقبة تغيير حالة الاتصال
    window.addEventListener('online', updateStats);
    window.addEventListener('offline', updateStats);

    // مراقبة تغيير نوع الاتصال
    if ('connection' in navigator) {
      // @ts-ignore
      navigator.connection.addEventListener('change', updateStats);
    }

    return () => {
      window.removeEventListener('online', updateStats);
      window.removeEventListener('offline', updateStats);
      if ('connection' in navigator) {
        // @ts-ignore
        navigator.connection.removeEventListener('change', updateStats);
      }
    };
  }, [isMobile]);

  // إخفاء المكون إذا لم يكن جوال
  if (!isMobile) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 space-y-2">
      {/* مؤشر حالة الاتصال */}
      <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border">
        {stats.isOnline ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
        <Badge variant={stats.isOnline ? "default" : "destructive"}>
          {stats.isOnline ? stats.connectionType.toUpperCase() : 'غير متصل'}
        </Badge>
      </div>

      {/* مؤشر الذاكرة */}
      {stats.memoryUsage && (
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border">
          <Smartphone className="h-4 w-4 text-blue-500" />
          <div className="text-xs">
            <span>{stats.memoryUsage.used}MB</span>
            <Badge 
              variant={stats.memoryUsage.percentage > 80 ? "destructive" : "outline"}
              className="ml-1"
            >
              {stats.memoryUsage.percentage}%
            </Badge>
          </div>
        </div>
      )}

      {/* تنبيه الشبكة البطيئة */}
      {showAlert && stats.isSlowConnection && (
        <Alert className="w-64">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-right">
            الشبكة بطيئة ({stats.connectionType}). قد يستغرق التحميل وقتاً أطول.
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowAlert(false)}
              className="mt-2 w-full"
            >
              فهمت
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Hook لتحسين الأداء للجوال
export function useMobilePerformanceOptimization() {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) return;

    // تحسين events للجوال
    const handleTouchStart = () => {};
    document.addEventListener('touchstart', handleTouchStart, { passive: true });

    // منع zoom عند النقر المزدوج
    let lastTouchEnd = 0;
    const handleTouchEnd = (event: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    };
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    // تحسين scroll للجوال
    const handleScroll = () => {
      // إخفاء address bar في Safari
      if (window.scrollY > 0) {
        window.scrollTo(0, 1);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // تنظيف memory عند إخفاء الصفحة
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // تنظيف الذاكرة عند إخفاء التطبيق
        if ((window as any).gc) {
          (window as any).gc();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isMobile]);

  return {
    isMobile,
    optimizationsEnabled: isMobile,
  };
} 