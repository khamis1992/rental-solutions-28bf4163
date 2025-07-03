import React, { Suspense, useDeferredValue, startTransition, useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// مكونات محسنة بـ lazy loading
const DashboardMetrics = React.lazy(() => 
  import('./DashboardMetrics').then(module => ({ 
    default: module.DashboardMetrics || module.default 
  }))
);

const QuickActions = React.lazy(() => 
  import('./QuickActions').then(module => ({ 
    default: module.QuickActions || module.default 
  }))
);

const VehicleStatusChart = React.lazy(() => 
  import('./vehicle-status/VehicleStatusChart').then(module => ({ 
    default: module.VehicleStatusChart || module.default 
  }))
);

const RecentActivities = React.lazy(() => 
  import('./RecentActivities').then(module => ({ 
    default: module.RecentActivities || module.default 
  }))
);

// مكون التحميل المحسن
const OptimizedSkeleton = ({ type }: { type: 'metrics' | 'chart' | 'actions' | 'activities' }) => {
  const skeletonClasses = {
    metrics: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
    chart: "bg-white rounded-lg p-6 h-96",
    actions: "bg-white rounded-lg p-6 h-64",
    activities: "bg-white rounded-lg p-6 h-80"
  };

  const itemClasses = {
    metrics: "bg-gray-100 rounded-lg h-32 animate-pulse",
    chart: "bg-gray-100 rounded-lg h-full animate-pulse",
    actions: "space-y-4",
    activities: "space-y-3"
  };

  if (type === 'metrics') {
    return (
      <div className={skeletonClasses.metrics}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className={itemClasses.metrics} />
        ))}
      </div>
    );
  }

  if (type === 'actions') {
    return (
      <div className={skeletonClasses.actions}>
        <div className={itemClasses.actions}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded h-12 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'activities') {
    return (
      <div className={skeletonClasses.activities}>
        <div className={itemClasses.activities}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded h-16 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return <div className={skeletonClasses.chart}><div className={itemClasses.chart} /></div>;
};

// Hook للبيانات المؤجلة
const useDeferredDashboardData = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard-overview', deferredSearchQuery],
    queryFn: async () => {
      // محاكاة تحميل البيانات
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        metrics: {
          totalVehicles: 150,
          activeAgreements: 89,
          pendingPayments: 12,
          monthlyRevenue: 245000
        },
        recentActivities: [
          { id: 1, type: 'agreement', message: 'اتفاقية جديدة تم إنشاؤها', time: '5 دقائق' },
          { id: 2, type: 'payment', message: 'دفعة جديدة تم استلامها', time: '10 دقائق' },
          { id: 3, type: 'vehicle', message: 'مركبة تم إرجاعها', time: '15 دقيقة' }
        ],
        chartData: [
          { month: 'يناير', revenue: 200000 },
          { month: 'فبراير', revenue: 220000 },
          { month: 'مارس', revenue: 245000 }
        ]
      };
    },
    staleTime: 5 * 60 * 1000, // 5 دقائق
    gcTime: 10 * 60 * 1000,   // 10 دقائق
  });

  const updateSearchQuery = useCallback((query: string) => {
    startTransition(() => {
      setSearchQuery(query);
    });
  }, []);

  return {
    dashboardData,
    isLoading,
    error,
    searchQuery,
    updateSearchQuery,
    isPending: searchQuery !== deferredSearchQuery
  };
};

// المكون الرئيسي
export const ConcurrentDashboard: React.FC = () => {
  const { dashboardData, isLoading, error, isPending } = useDeferredDashboardData();
  
  // تحسين العرض بناءً على الحالة
  const dashboardContent = useMemo(() => {
    if (error) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-600 mb-2">خطأ في تحميل البيانات</h3>
            <p className="text-gray-600">يرجى المحاولة مرة أخرى</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 p-6">
        {/* مؤشر التحديث */}
        {isPending && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-800 text-sm">
            🔄 جارٍ تحديث البيانات...
          </div>
        )}
        
        {/* المقاييس الرئيسية */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">المقاييس الرئيسية</h2>
          <ErrorBoundary>
            <Suspense fallback={<OptimizedSkeleton type="metrics" />}>
              <DashboardMetrics data={dashboardData?.metrics} />
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* محتوى الداشبورد */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* الإجراءات السريعة */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">الإجراءات السريعة</h3>
            <ErrorBoundary>
              <Suspense fallback={<OptimizedSkeleton type="actions" />}>
                <QuickActions />
              </Suspense>
            </ErrorBoundary>
          </div>

          {/* مخطط حالة المركبات */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">حالة المركبات</h3>
            <ErrorBoundary>
              <Suspense fallback={<OptimizedSkeleton type="chart" />}>
                <VehicleStatusChart data={dashboardData?.chartData} />
              </Suspense>
            </ErrorBoundary>
          </div>

          {/* الأنشطة الأخيرة */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">الأنشطة الأخيرة</h3>
            <ErrorBoundary>
              <Suspense fallback={<OptimizedSkeleton type="activities" />}>
                <RecentActivities activities={dashboardData?.recentActivities} />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </div>
    );
  }, [dashboardData, error, isPending]);

  // عرض التحميل الأولي
  if (isLoading && !dashboardData) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جارٍ تحميل لوحة التحكم...</p>
        </div>
        <OptimizedSkeleton type="metrics" />
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <OptimizedSkeleton type="actions" />
          <OptimizedSkeleton type="chart" />
          <OptimizedSkeleton type="activities" />
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {dashboardContent}
    </ErrorBoundary>
  );
};

export default ConcurrentDashboard; 