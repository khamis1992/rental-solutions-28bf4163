import React, { memo, useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  Clock, 
  Eye, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Gauge
} from 'lucide-react';
import { performanceMonitor, useMemoryTracker, PerformanceBudget } from '@/utils/performance-utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useMemoryOptimizer } from '@/utils/memory-optimizer';

interface PerformanceMonitorWidgetProps {
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

// Format bytes to readable format
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format time to readable format
const formatTime = (ms: number): string => {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

// Performance status indicator
const PerformanceStatus = memo(({ value, threshold, label, unit = 'ms' }: {
  value: number;
  threshold: number;
  label: string;
  unit?: string;
}) => {
  const status = useMemo(() => {
    if (value <= threshold * 0.7) return 'excellent';
    if (value <= threshold) return 'good';
    if (value <= threshold * 1.5) return 'warning';
    return 'critical';
  }, [value, threshold]);

  const statusConfig = useMemo(() => ({
    excellent: { 
      color: 'bg-green-500', 
      icon: CheckCircle, 
      label: 'ممتاز',
      textColor: 'text-green-700'
    },
    good: { 
      color: 'bg-blue-500', 
      icon: TrendingUp, 
      label: 'جيد',
      textColor: 'text-blue-700'
    },
    warning: { 
      color: 'bg-yellow-500', 
      icon: AlertTriangle, 
      label: 'تحذير',
      textColor: 'text-yellow-700'
    },
    critical: { 
      color: 'bg-red-500', 
      icon: TrendingDown, 
      label: 'حرج',
      textColor: 'text-red-700'
    }
  }), []);

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2 text-right" dir="rtl">
      <div className="flex items-center gap-1">
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{value.toFixed(1)}{unit}</span>
      </div>
      <Badge variant="outline" className={cn('text-xs', config.textColor)}>
        {config.label}
      </Badge>
      <div className="flex-1 text-right">
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
    </div>
  );
});

PerformanceStatus.displayName = 'PerformanceStatus';

// Memory usage indicator
const MemoryUsageIndicator = memo(({ 
  memoryUsage, 
  onCleanup, 
  isCleaningUp 
}: { 
  memoryUsage: number;
  onCleanup?: () => void;
  isCleaningUp?: boolean;
}) => {
  const memoryMB = memoryUsage / (1024 * 1024);
  const budget = 200; // 200MB budget - أكثر واقعية للتطبيقات المعقدة
  const percentage = (memoryMB / budget) * 100;

  // تحديد حالة الذاكرة
  const getMemoryStatus = () => {
    if (percentage > 90) return { color: 'text-red-600', status: 'حرج' };
    if (percentage > 75) return { color: 'text-yellow-600', status: 'مرتفع' };
    if (percentage > 50) return { color: 'text-blue-600', status: 'طبيعي' };
    return { color: 'text-green-600', status: 'ممتاز' };
  };

  const status = getMemoryStatus();

  return (
    <div className="space-y-2" dir="rtl">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          {formatBytes(memoryUsage)}
        </span>
        <span className="text-sm font-medium">استخدام الذاكرة</span>
      </div>
      <Progress value={Math.min(percentage, 100)} className="h-2" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className={status.color}>{percentage.toFixed(1)}% ({status.status})</span>
        <span>الحد الأقصى: {budget}MB</span>
      </div>
      {percentage > 85 && onCleanup && (
        <div className="text-xs p-2 bg-yellow-50 rounded space-y-2">
          <div className="text-yellow-600">
            ⚠️ استخدام الذاكرة مرتفع - يُنصح بتنظيف الذاكرة
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onCleanup}
            disabled={isCleaningUp}
            className="w-full text-xs h-6"
          >
            {isCleaningUp ? '🧹 جاري التنظيف...' : '🗑️ تنظيف الذاكرة'}
          </Button>
        </div>
      )}
    </div>
  );
});

MemoryUsageIndicator.displayName = 'MemoryUsageIndicator';

// Real-time performance metrics
const RealTimeMetrics = memo(() => {
  const [metrics, setMetrics] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    const updateMetrics = () => {
      const newSummary = performanceMonitor.getSummary();
      setSummary(newSummary);
    };

    const unsubscribe = performanceMonitor.subscribe((newMetrics) => {
      setMetrics(newMetrics);
    });

    // Update every 2 seconds
    const interval = setInterval(updateMetrics, 2000);
    updateMetrics(); // Initial update

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  if (!summary) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <PerformanceStatus
            value={summary.averageRenderTime}
            threshold={16}
            label="متوسط وقت العرض"
            unit="ms"
          />
          <PerformanceStatus
            value={summary.totalRerenders}
            threshold={10}
            label="إعادة العرض"
            unit=""
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center text-right" dir="rtl">
            <span className="text-sm text-muted-foreground">
              {summary.slowestOperations.length}
            </span>
            <span className="text-sm font-medium">العمليات البطيئة</span>
          </div>
          <div className="flex justify-between items-center text-right" dir="rtl">
            <span className="text-sm text-muted-foreground">
              {metrics?.componentCount || 0}
            </span>
            <span className="text-sm font-medium">المكونات النشطة</span>
          </div>
        </div>
      </div>

      {/* Slowest operations */}
      {summary.slowestOperations.length > 0 && (
        <div className="space-y-2">
          <Separator />
          <div className="text-sm font-medium text-right">العمليات الأبطأ</div>
          <div className="space-y-1">
            {summary.slowestOperations.slice(0, 3).map((op: any, index: number) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">
                  {formatTime(op.duration)}
                </span>
                <span className="font-mono text-right truncate max-w-[150px]">
                  {op.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

RealTimeMetrics.displayName = 'RealTimeMetrics';

export const PerformanceMonitorWidget: React.FC<PerformanceMonitorWidgetProps> = memo(({
  isMinimized = false,
  onToggleMinimize
}) => {
  const { language } = useLanguage();
  const memoryUsage = useMemoryTracker();
  const { stats: memoryStats, performCleanup, getReport } = useMemoryOptimizer();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleClearMetrics = () => {
    // Clear performance metrics
    performanceMonitor.getSummary(); // This will reset internal state
    console.log('🧹 Performance metrics cleared');
  };

  const handleMemoryCleanup = async () => {
    setIsCleaningUp(true);
    try {
      await performCleanup();
      console.log('✅ Memory cleanup completed');
    } catch (error) {
      console.error('❌ Memory cleanup failed:', error);
    } finally {
      setIsCleaningUp(false);
    }
  };

  if (isMinimized) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <Button variant="ghost" size="sm" onClick={onToggleMinimize}>
              <Eye className="h-4 w-4" />
            </Button>
            <CardTitle className="text-sm flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              مراقب الأداء
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-muted-foreground text-center">
            انقر لتوسيع
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleClearMetrics}>
              <Activity className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleToggleExpand}>
              <BarChart3 className="h-4 w-4" />
            </Button>
            {onToggleMinimize && (
              <Button variant="ghost" size="sm" onClick={onToggleMinimize}>
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>
          <CardTitle className="flex items-center gap-2 text-right">
            <Zap className="h-4 w-4" />
            مراقب الأداء
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Memory Usage */}
        <MemoryUsageIndicator 
          memoryUsage={memoryUsage} 
          onCleanup={handleMemoryCleanup}
          isCleaningUp={isCleaningUp}
        />
        
        <Separator />
        
        {/* Real-time Metrics */}
        <RealTimeMetrics />
        
        {/* Expanded view */}
        {isExpanded && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="text-sm font-medium text-right">نصائح التحسين</div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 text-right" dir="rtl">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>استخدم React.memo للمكونات الثقيلة</span>
                </div>
                <div className="flex items-center gap-2 text-right" dir="rtl">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>استخدم useMemo للحسابات المعقدة</span>
                </div>
                <div className="flex items-center gap-2 text-right" dir="rtl">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>استخدم useCallback للدوال</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
});

PerformanceMonitorWidget.displayName = 'PerformanceMonitorWidget';

export default PerformanceMonitorWidget; 