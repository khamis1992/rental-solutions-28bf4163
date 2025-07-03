import React, { Suspense, useMemo, useCallback } from 'react';
import { usePerformanceOptimization } from '@/utils/performance-optimizer';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// Lazy Loading للمكونات الثقيلة
const DashboardContent = React.lazy(() => 
  import('./DashboardContent').then(module => ({ default: module.DashboardContent }))
);

const QuickActions = React.lazy(() => 
  import('./QuickActions').then(module => ({ default: module.QuickActions }))
);

const KeyMetrics = React.lazy(() => 
  import('./KeyMetrics').then(module => ({ default: module.KeyMetrics }))
);

const VehicleStatusChart = React.lazy(() => 
  import('./vehicle-status/VehicleStatusChart').then(module => ({ 
    default: module.VehicleStatusChart 
  }))
);

// Loading Skeleton Components
const DashboardSkeleton = () => (
  <div className="space-y-6 p-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-gray-100 rounded-lg h-32 animate-pulse" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-gray-100 rounded-lg h-96 animate-pulse" />
      <div className="bg-gray-100 rounded-lg h-96 animate-pulse" />
    </div>
  </div>
);

const QuickActionsSkeleton = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-gray-100 rounded-lg h-20 animate-pulse" />
    ))}
  </div>
);

interface OptimizedDashboardProps {
  enableAnimations?: boolean;
  loadPriority?: 'high' | 'normal' | 'low';
}

export const OptimizedDashboard: React.FC<OptimizedDashboardProps> = ({ 
  enableAnimations = true,
  loadPriority = 'high' 
}) => {
  const { optimizeComponent, batchRequests } = usePerformanceOptimization();

  // تحسين التحميل بناءً على الأولوية
  const loadingConfig = useMemo(() => {
    const baseConfig = optimizeComponent();
    
    return {
      ...baseConfig,
      priority: loadPriority,
      enableAnimations,
      // تخصيص أوقات التحميل حسب الأولوية
      loadDelay: loadPriority === 'high' ? 0 : loadPriority === 'normal' ? 100 : 200
    };
  }, [loadPriority, enableAnimations, optimizeComponent]);

  // تحميل البيانات بطريقة مجمعة
  const loadDashboardData = useCallback(async () => {
    const dataRequests = [
      () => import('@/hooks/use-dashboard-metrics'),
      () => import('@/hooks/useAgreementService'),
      () => import('@/hooks/useCustomerService'),
    ];

    try {
      await batchRequests(dataRequests, 2);
    } catch (error) {
      console.warn('⚠️ Failed to batch load dashboard data:', error);
    }
  }, [batchRequests]);

  // تأثير جانبي لتحميل البيانات
  React.useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 rtl">
        {/* Header Section */}
        <div className="bg-white shadow-sm border-b border-gray-200 mb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4">
              <h1 className="text-2xl font-bold text-gray-900 font-arabic">
                لوحة التحكم
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                نظرة شاملة على أداء النظام
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Quick Actions - تحميل فوري */}
          <Suspense fallback={<QuickActionsSkeleton />}>
            <QuickActions />
          </Suspense>

          {/* Key Metrics - تحميل أولوية عالية */}
          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-lg h-32 animate-pulse" />
              ))}
            </div>
          }>
            <KeyMetrics />
          </Suspense>

          {/* Dashboard Content - تحميل تدريجي */}
          <Suspense fallback={<DashboardSkeleton />}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Vehicle Status Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <Suspense fallback={
                  <div className="h-80 bg-gray-100 rounded-lg animate-pulse" />
                }>
                  <VehicleStatusChart />
                </Suspense>
              </div>

              {/* Dashboard Statistics */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <Suspense fallback={
                  <div className="h-80 bg-gray-100 rounded-lg animate-pulse" />
                }>
                  <DashboardContent />
                </Suspense>
              </div>
            </div>
          </Suspense>
        </div>

        {/* Performance Indicator */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs">
            🚀 Optimized Dashboard
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

// تصدير مع تحسين إضافي
export default React.memo(OptimizedDashboard); 