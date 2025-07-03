import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PerformanceMetrics {
  // Core Web Vitals
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  
  // Memory metrics
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
  
  // Network
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  
  // Custom metrics
  renderTime?: number;
  queryCount?: number;
  cacheHitRate?: number;
  bundleSize?: number;
}

interface PerformanceState {
  metrics: PerformanceMetrics;
  isMonitoring: boolean;
  recommendations: string[];
  score: number;
}

// Hook لمراقبة الأداء المتقدم
const useAdvancedPerformanceMonitor = () => {
  const [state, setState] = useState<PerformanceState>({
    metrics: {},
    isMonitoring: false,
    recommendations: [],
    score: 0
  });

  const [realTimeMetrics, setRealTimeMetrics] = useState<PerformanceMetrics>({});

  // قياس Core Web Vitals
  const measureCoreWebVitals = useCallback(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        switch (entry.entryType) {
          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              setRealTimeMetrics(prev => ({ ...prev, fcp: entry.startTime }));
            }
            break;
          case 'largest-contentful-paint':
            setRealTimeMetrics(prev => ({ ...prev, lcp: entry.startTime }));
            break;
          case 'first-input':
            setRealTimeMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }));
            break;
          case 'layout-shift':
            if (!entry.hadRecentInput) {
              setRealTimeMetrics(prev => ({ 
                ...prev, 
                cls: (prev.cls || 0) + (entry as any).value 
              }));
            }
            break;
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (e) {
      console.warn('Performance Observer not fully supported');
    }

    return () => observer.disconnect();
  }, []);

  // قياس استخدام الذاكرة
  const measureMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      
      setRealTimeMetrics(prev => ({
        ...prev,
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      }));
    }
  }, []);

  // قياس معلومات الشبكة
  const measureNetworkInfo = useCallback(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      setRealTimeMetrics(prev => ({
        ...prev,
        connectionType: connection.type,
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      }));
    }
  }, []);

  // حساب نقاط الأداء
  const calculatePerformanceScore = useCallback((metrics: PerformanceMetrics): number => {
    let score = 100;
    
    // Core Web Vitals scoring
    if (metrics.fcp) {
      if (metrics.fcp > 3000) score -= 20;
      else if (metrics.fcp > 1800) score -= 10;
    }
    
    if (metrics.lcp) {
      if (metrics.lcp > 4000) score -= 25;
      else if (metrics.lcp > 2500) score -= 15;
    }
    
    if (metrics.fid) {
      if (metrics.fid > 300) score -= 20;
      else if (metrics.fid > 100) score -= 10;
    }
    
    if (metrics.cls && metrics.cls > 0.25) {
      score -= 15;
    }
    
    // Memory usage scoring
    if (metrics.usedJSHeapSize && metrics.jsHeapSizeLimit) {
      const memoryUsagePercent = (metrics.usedJSHeapSize / metrics.jsHeapSizeLimit) * 100;
      if (memoryUsagePercent > 80) score -= 15;
      else if (memoryUsagePercent > 60) score -= 10;
    }
    
    return Math.max(0, score);
  }, []);

  // إنشاء التوصيات
  const generateRecommendations = useCallback((metrics: PerformanceMetrics): string[] => {
    const recommendations: string[] = [];
    
    if (metrics.fcp && metrics.fcp > 1800) {
      recommendations.push('تحسين وقت رسم المحتوى الأول - استخدم lazy loading وتحسين الخطوط');
    }
    
    if (metrics.lcp && metrics.lcp > 2500) {
      recommendations.push('تحسين وقت رسم أكبر محتوى - قم بتحسين الصور وإزالة موارد غير ضرورية');
    }
    
    if (metrics.fid && metrics.fid > 100) {
      recommendations.push('تحسين تأخير الاستجابة - قلل من العمليات الطويلة في الـ main thread');
    }
    
    if (metrics.cls && metrics.cls > 0.25) {
      recommendations.push('تقليل تغيير التخطيط - حدد أبعاد العناصر مسبقاً');
    }
    
    if (metrics.usedJSHeapSize && metrics.jsHeapSizeLimit) {
      const memoryUsagePercent = (metrics.usedJSHeapSize / metrics.jsHeapSizeLimit) * 100;
      if (memoryUsagePercent > 60) {
        recommendations.push('تحسين استخدام الذاكرة - قم بتنظيف المتغيرات غير المستخدمة');
      }
    }
    
    if (metrics.effectiveType && ['slow-2g', '2g'].includes(metrics.effectiveType)) {
      recommendations.push('الشبكة بطيئة - قم بتحسين حجم الملفات وتفعيل الضغط');
    }
    
    return recommendations;
  }, []);

  // بدء المراقبة
  const startMonitoring = useCallback(() => {
    setState(prev => ({ ...prev, isMonitoring: true }));
    
    const cleanupCoreWebVitals = measureCoreWebVitals();
    
    const intervalId = setInterval(() => {
      measureMemoryUsage();
      measureNetworkInfo();
    }, 2000);
    
    return () => {
      cleanupCoreWebVitals();
      clearInterval(intervalId);
    };
  }, [measureCoreWebVitals, measureMemoryUsage, measureNetworkInfo]);

  // إيقاف المراقبة
  const stopMonitoring = useCallback(() => {
    setState(prev => ({ ...prev, isMonitoring: false }));
  }, []);

  // تحديث الحالة عند تغيير المقاييس
  useEffect(() => {
    const score = calculatePerformanceScore(realTimeMetrics);
    const recommendations = generateRecommendations(realTimeMetrics);
    
    setState(prev => ({
      ...prev,
      metrics: realTimeMetrics,
      score,
      recommendations
    }));
  }, [realTimeMetrics, calculatePerformanceScore, generateRecommendations]);

  return {
    ...state,
    startMonitoring,
    stopMonitoring,
    realTimeMetrics
  };
};

// مكون عرض المقاييس
const MetricCard: React.FC<{
  title: string;
  value: number | string | undefined;
  unit?: string;
  threshold?: { good: number; poor: number };
  format?: (value: number) => string;
}> = ({ title, value, unit = '', threshold, format }) => {
  const numericValue = typeof value === 'number' ? value : parseFloat(value as string) || 0;
  
  const getStatus = () => {
    if (!threshold || typeof value !== 'number') return 'neutral';
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  const status = getStatus();
  const statusColors = {
    good: 'bg-green-500',
    'needs-improvement': 'bg-yellow-500',
    poor: 'bg-red-500',
    neutral: 'bg-gray-500'
  };

  const displayValue = format && typeof value === 'number' 
    ? format(value) 
    : typeof value === 'number' 
      ? value.toFixed(1) 
      : value || 'غير متاح';

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">
            {displayValue}{unit}
          </span>
          <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
        </div>
      </CardContent>
    </Card>
  );
};

// المكون الرئيسي
export const AdvancedPerformanceMonitor: React.FC = () => {
  const {
    metrics,
    isMonitoring,
    recommendations,
    score,
    startMonitoring,
    stopMonitoring
  } = useAdvancedPerformanceMonitor();

  const memoryUsagePercent = useMemo(() => {
    if (metrics.usedJSHeapSize && metrics.jsHeapSizeLimit) {
      return (metrics.usedJSHeapSize / metrics.jsHeapSizeLimit) * 100;
    }
    return 0;
  }, [metrics.usedJSHeapSize, metrics.jsHeapSizeLimit]);

  const formatBytes = (bytes: number | undefined) => {
    if (!bytes) return '0';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 space-y-6">
      {/* رأس المراقب */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">مراقب الأداء المتقدم</h2>
          <p className="text-gray-600">مراقبة الأداء في الوقت الفعلي وتحليل Core Web Vitals</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
              {score}
            </div>
            <div className="text-sm text-gray-500">نقاط الأداء</div>
          </div>
          
          <Button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            variant={isMonitoring ? "outline" : "default"}
            className="min-w-[120px]"
          >
            {isMonitoring ? '⏸️ إيقاف' : '▶️ بدء'} المراقبة
          </Button>
        </div>
      </div>

      {/* حالة المراقبة */}
      {isMonitoring && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <div className="animate-pulse w-3 h-3 bg-green-500 rounded-full" />
          <span className="text-green-800 font-medium">المراقبة نشطة - يتم جمع البيانات في الوقت الفعلي</span>
        </div>
      )}

      <Tabs defaultValue="vitals" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vitals">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="memory">الذاكرة</TabsTrigger>
          <TabsTrigger value="network">الشبكة</TabsTrigger>
          <TabsTrigger value="recommendations">التوصيات</TabsTrigger>
        </TabsList>

        {/* Core Web Vitals */}
        <TabsContent value="vitals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="First Contentful Paint"
              value={metrics.fcp}
              unit="ms"
              threshold={{ good: 1800, poor: 3000 }}
            />
            <MetricCard
              title="Largest Contentful Paint"
              value={metrics.lcp}
              unit="ms"
              threshold={{ good: 2500, poor: 4000 }}
            />
            <MetricCard
              title="First Input Delay"
              value={metrics.fid}
              unit="ms"
              threshold={{ good: 100, poor: 300 }}
            />
            <MetricCard
              title="Cumulative Layout Shift"
              value={metrics.cls}
              threshold={{ good: 0.1, poor: 0.25 }}
              format={(value) => value.toFixed(3)}
            />
          </div>
        </TabsContent>

        {/* الذاكرة */}
        <TabsContent value="memory" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="الذاكرة المستخدمة"
              value={formatBytes(metrics.usedJSHeapSize)}
            />
            <MetricCard
              title="إجمالي الذاكرة"
              value={formatBytes(metrics.totalJSHeapSize)}
            />
            <MetricCard
              title="حد الذاكرة"
              value={formatBytes(metrics.jsHeapSizeLimit)}
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>استخدام الذاكرة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>نسبة الاستخدام</span>
                  <span>{memoryUsagePercent.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={memoryUsagePercent} 
                  className="h-2"
                />
                {memoryUsagePercent > 80 && (
                  <p className="text-red-600 text-sm">
                    ⚠️ استخدام الذاكرة مرتفع جداً
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* الشبكة */}
        <TabsContent value="network" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="نوع الاتصال"
              value={metrics.connectionType || 'غير معروف'}
            />
            <MetricCard
              title="السرعة الفعالة"
              value={metrics.effectiveType || 'غير معروف'}
            />
            <MetricCard
              title="سرعة التحميل"
              value={metrics.downlink}
              unit=" Mbps"
            />
            <MetricCard
              title="زمن الاستجابة"
              value={metrics.rtt}
              unit="ms"
            />
          </div>
          
          {metrics.effectiveType && ['slow-2g', '2g', '3g'].includes(metrics.effectiveType) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">شبكة بطيئة مكتشفة</h4>
              <p className="text-yellow-700">
                يبدو أن المستخدم يستخدم شبكة بطيئة. فكر في تحسين الموارد وتقليل أحجام الملفات.
              </p>
            </div>
          )}
        </TabsContent>

        {/* التوصيات */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💡 توصيات تحسين الأداء
                <Badge variant="secondary">{recommendations.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recommendations.length > 0 ? (
                <ul className="space-y-3">
                  {recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <span className="text-blue-600 font-bold text-lg">•</span>
                      <span className="text-blue-800">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">✅</div>
                  <p>ممتاز! لا توجد توصيات للتحسين حالياً.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedPerformanceMonitor; 