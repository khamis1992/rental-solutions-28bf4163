import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Zap, 
  Database, 
  Network, 
  HardDrive, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Trash2,
  Download
} from 'lucide-react';
import { useServiceWorker, useLoadingPerformance } from '@/hooks/useServiceWorker';
import { useCacheInspector, useQueryPerformance } from '@/hooks/useOptimizedQuery';
import { useToast } from '@/hooks/use-toast';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  cacheHitRate: number;
  bundleSize: number;
  memoryUsage: number;
  networkRequests: number;
  queryCount: number;
  errorRate: number;
}

interface SystemHealth {
  overall: 'excellent' | 'good' | 'fair' | 'poor';
  score: number;
  issues: string[];
  recommendations: string[];
}

export const PerformanceMonitor: React.FC = () => {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    cacheHitRate: 0,
    bundleSize: 0,
    memoryUsage: 0,
    networkRequests: 0,
    queryCount: 0,
    errorRate: 0
  });

  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    overall: 'good',
    score: 85,
    issues: [],
    recommendations: []
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Service Worker hooks
  const { 
    isRegistered, 
    needsUpdate, 
    updateServiceWorker, 
    clearCache 
  } = useServiceWorker();

  // Cache hooks
  const { getCacheStats, clearCache: clearQueryCache, invalidateQueries } = useCacheInspector();
  const { getPerformanceMetrics } = useQueryPerformance();
  
  // Performance hooks
  const loadingMetrics = useLoadingPerformance();

  // جمع المقاييس
  const collectMetrics = async () => {
    setIsRefreshing(true);
    
    try {
      // مقاييس التحميل
      const startTime = performance.now();
      
      // مقاييس الكاش
      const cacheStats = getCacheStats();
      const queryMetrics = getPerformanceMetrics();
      
      // مقاييس الشبكة
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType('resource');
      
      // مقاييس الذاكرة (إذا متوفرة)
      let memoryInfo = 0;
      if ('memory' in performance) {
        // @ts-ignore
        memoryInfo = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
      }

      const newMetrics: PerformanceMetrics = {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        renderTime: performance.now() - startTime,
        cacheHitRate: cacheStats.totalQueries > 0 
          ? ((cacheStats.cachedQueries / cacheStats.totalQueries) * 100) 
          : 0,
        bundleSize: resources.reduce((acc, res) => acc + (res.transferSize || 0), 0) / 1024, // KB
        memoryUsage: memoryInfo,
        networkRequests: resources.length,
        queryCount: queryMetrics.totalQueries,
        errorRate: cacheStats.totalQueries > 0 
          ? ((cacheStats.errorQueries / cacheStats.totalQueries) * 100) 
          : 0
      };

      setMetrics(newMetrics);
      
      // تقييم صحة النظام
      evaluateSystemHealth(newMetrics);
      
    } catch (error) {
      if (error instanceof Error) {
        console.error('Performance metrics collection failed:', {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
      }
      toast({
        title: "خطأ في جمع المقاييس",
        description: "فشل في جمع مقاييس الأداء",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // تقييم صحة النظام
  const evaluateSystemHealth = (metrics: PerformanceMetrics) => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // فحص وقت التحميل
    if (metrics.loadTime > 3000) {
      issues.push('وقت التحميل بطيء جداً');
      recommendations.push('تحسين التخزين المؤقت وضغط الموارد');
      score -= 20;
    } else if (metrics.loadTime > 1500) {
      issues.push('وقت التحميل يحتاج تحسين');
      recommendations.push('تطبيق Lazy Loading للمكونات');
      score -= 10;
    }

    // فحص معدل نجاح الكاش
    if (metrics.cacheHitRate < 70) {
      issues.push('معدل نجاح التخزين المؤقت منخفض');
      recommendations.push('تحسين استراتيجية التخزين المؤقت');
      score -= 15;
    }

    // فحص استخدام الذاكرة
    if (metrics.memoryUsage > 100) {
      issues.push('استخدام ذاكرة عالي');
      recommendations.push('تنظيف الذاكرة وإزالة التسريبات');
      score -= 15;
    }

    // فحص معدل الأخطاء
    if (metrics.errorRate > 5) {
      issues.push('معدل أخطاء عالي');
      recommendations.push('مراجعة وإصلاح أخطاء الاستعلامات');
      score -= 25;
    }

    let overall: SystemHealth['overall'] = 'excellent';
    if (score < 60) overall = 'poor';
    else if (score < 75) overall = 'fair';
    else if (score < 90) overall = 'good';

    setSystemHealth({
      overall,
      score: Math.max(0, score),
      issues,
      recommendations
    });
  };

  // تنظيف الكاش الشامل
  const performDeepClean = async () => {
    try {
      await clearCache();
      clearQueryCache();
      
      // تنظيف Local Storage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('cache') || key.includes('temp'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      toast({
        title: "تنظيف شامل مكتمل",
        description: "تم تنظيف جميع أنواع التخزين المؤقت",
      });
      
      collectMetrics();
    } catch (error) {
      toast({
        title: "خطأ في التنظيف",
        description: "فشل في تنظيف التخزين المؤقت",
        variant: "destructive"
      });
    }
  };

  // تصدير التقرير
  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      metrics,
      systemHealth,
      serviceWorker: {
        isRegistered,
        needsUpdate
      },
      browserInfo: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    collectMetrics();
    
    // تحديث المقاييس كل دقيقة
    const interval = setInterval(collectMetrics, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (health: SystemHealth['overall']) => {
    switch (health) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'fair': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getHealthIcon = (health: SystemHealth['overall']) => {
    switch (health) {
      case 'excellent': 
      case 'good': 
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'fair': 
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'poor': 
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: 
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">مراقب الأداء</h1>
          <p className="text-muted-foreground">مراقبة شاملة لأداء التطبيق</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={collectMetrics}
            disabled={isRefreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            تصدير التقرير
          </Button>
        </div>
      </div>

      {/* ملخص صحة النظام */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getHealthIcon(systemHealth.overall)}
            صحة النظام العامة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span>نقاط الأداء</span>
                <span className="font-bold">{systemHealth.score}/100</span>
              </div>
              <Progress value={systemHealth.score} className="h-3" />
            </div>
            <Badge className={getHealthColor(systemHealth.overall)}>
              {systemHealth.overall === 'excellent' && 'ممتاز'}
              {systemHealth.overall === 'good' && 'جيد'}
              {systemHealth.overall === 'fair' && 'مقبول'}
              {systemHealth.overall === 'poor' && 'ضعيف'}
            </Badge>
          </div>

          {systemHealth.issues.length > 0 && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">مشاكل مكتشفة:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {systemHealth.issues.map((issue, index) => (
                      <li key={index} className="text-sm">{issue}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {systemHealth.recommendations.length > 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">توصيات للتحسين:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {systemHealth.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm">{rec}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* علامات التبويب */}
      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics">المقاييس</TabsTrigger>
          <TabsTrigger value="cache">التخزين المؤقت</TabsTrigger>
          <TabsTrigger value="network">الشبكة</TabsTrigger>
          <TabsTrigger value="system">النظام</TabsTrigger>
        </TabsList>

        {/* مقاييس الأداء */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">وقت التحميل</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.loadTime.toFixed(0)} ms</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.loadTime < 1000 ? 'سريع' : metrics.loadTime < 3000 ? 'مقبول' : 'بطيء'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">معدل نجاح الكاش</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.cacheHitRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.cacheHitRate > 80 ? 'ممتاز' : metrics.cacheHitRate > 60 ? 'جيد' : 'يحتاج تحسين'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">استخدام الذاكرة</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.memoryUsage.toFixed(1)} MB</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.memoryUsage < 50 ? 'منخفض' : metrics.memoryUsage < 100 ? 'متوسط' : 'عالي'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">معدل الأخطاء</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.errorRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.errorRate < 1 ? 'ممتاز' : metrics.errorRate < 5 ? 'مقبول' : 'مرتفع'}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* إدارة التخزين المؤقت */}
        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إدارة التخزين المؤقت</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Service Worker</p>
                  <p className="text-sm text-muted-foreground">
                    {isRegistered ? 'مفعل ويعمل' : 'غير مفعل'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {needsUpdate && (
                    <Button onClick={updateServiceWorker} size="sm">
                      تحديث
                    </Button>
                  )}
                  <Badge variant={isRegistered ? "default" : "secondary"}>
                    {isRegistered ? 'مفعل' : 'معطل'}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={performDeepClean} variant="outline">
                  <Trash2 className="h-4 w-4 mr-2" />
                  تنظيف شامل
                </Button>
                <Button onClick={() => invalidateQueries('*')} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  تحديث جميع الاستعلامات
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* مقاييس الشبكة */}
        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>أداء الشبكة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <Network className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold">{metrics.networkRequests}</p>
                  <p className="text-sm text-muted-foreground">طلبات الشبكة</p>
                </div>
                <div className="text-center">
                  <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                  <p className="text-2xl font-bold">{metrics.bundleSize.toFixed(0)} KB</p>
                  <p className="text-sm text-muted-foreground">حجم الحزمة</p>
                </div>
                <div className="text-center">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold">{metrics.queryCount}</p>
                  <p className="text-sm text-muted-foreground">الاستعلامات</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* معلومات النظام */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>معلومات النظام</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>متصفح:</span>
                  <span>{navigator.userAgent.split(' ')[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span>اللغة:</span>
                  <span>{navigator.language}</span>
                </div>
                <div className="flex justify-between">
                  <span>متصل بالإنترنت:</span>
                  <Badge variant={navigator.onLine ? "default" : "destructive"}>
                    {navigator.onLine ? 'نعم' : 'لا'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>الكوكيز مفعلة:</span>
                  <Badge variant={navigator.cookieEnabled ? "default" : "destructive"}>
                    {navigator.cookieEnabled ? 'نعم' : 'لا'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceMonitor;  