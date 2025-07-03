import React, { Suspense, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useOptimizedQuery, useQuickQuery, useBatchQueries } from '@/hooks/useOptimizedQuery';
import { useServiceWorkerStatus } from '@/hooks/useServiceWorker';
import { VehicleService } from '@/services/VehicleService';
import { CustomerService } from '@/services/CustomerService';
import { AgreementService } from '@/services/AgreementService';
import { FinancialService } from '@/services/FinancialService';
import { ActivityService } from '@/services/ActivityService';
import { MaintenanceService } from '@/services/MaintenanceService';
import { NotificationService } from '@/services/NotificationService';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Car, Users, FileText, DollarSign, AlertCircle, Wrench } from 'lucide-react';

// Lazy Loading للمكونات الفرعية
const VehicleStatusChart = React.lazy(() => 
  import('./VehicleStatusChart').then(module => ({ default: module.VehicleStatusChart }))
);

const RecentActivities = React.lazy(() => 
  import('./RecentActivities').then(module => ({ default: module.RecentActivities }))
);

const QuickActions = React.lazy(() => 
  import('./QuickActions').then(module => ({ default: module.QuickActions }))
);

const AdvancedAnalyticsPanel = React.lazy(() => 
  import('./AdvancedAnalyticsPanel').then(module => ({ default: module.AdvancedAnalyticsPanel }))
);

// مكون Skeleton محسن
const OptimizedSkeleton = ({ rows = 1, className = "h-4 w-full" }) => (
  <div className="animate-pulse space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className={`bg-gray-200 rounded ${className}`} />
    ))}
  </div>
);

// مكون إحصائيات محسن
const StatCard = React.memo(({ 
  title, 
  value, 
  icon: Icon, 
  color = "blue",
  isLoading = false,
  trend = null 
}) => (
  <Card className="relative overflow-hidden">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 text-${color}-600`} />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <OptimizedSkeleton className="h-8 w-24" />
      ) : (
        <div className="text-2xl font-bold">{value?.toLocaleString()}</div>
      )}
      {trend && (
        <p className={`text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {trend.percentage}% من الشهر الماضي
        </p>
      )}
    </CardContent>
  </Card>
));

StatCard.displayName = 'StatCard';

// مكون Dashboard الرئيسي المحسن
export const SuperOptimizedDashboard: React.FC = () => {
  const { language } = useLanguage();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { isOnline } = useServiceWorkerStatus();

  // استخدام نظام الاستعلامات المحسنة
  const { 
    data: vehicles = [], 
    isLoading: vehiclesLoading, 
    error: vehiclesError 
  } = useOptimizedQuery(
    ['vehicles-dashboard'], 
    VehicleService.fetchVehicles,
    { priority: 'critical' }
  );

  const { 
    data: customers = [], 
    isLoading: customersLoading 
  } = useOptimizedQuery(
    ['customers-dashboard'], 
    CustomerService.fetchCustomers,
    { priority: 'high' }
  );

  const { 
    data: agreements = [], 
    isLoading: agreementsLoading 
  } = useOptimizedQuery(
    ['agreements-dashboard'], 
    AgreementService.fetchAgreements,
    { priority: 'high' }
  );

  // استعلام سريع للبيانات المالية
  const { 
    data: financialData = {}, 
    isLoading: financialLoading 
  } = useQuickQuery(
    ['financial-dashboard'], 
    FinancialService.getDashboardFinancials
  );

  // استعلام للأنشطة الحديثة
  const { 
    data: activities = [], 
    isLoading: activitiesLoading 
  } = useOptimizedQuery(
    ['activities-dashboard'], 
    ActivityService.fetchRecentActivities,
    { priority: 'normal' }
  );

  // استعلام الصيانة القادمة
  const { 
    data: maintenance = [], 
    isLoading: maintenanceLoading 
  } = useOptimizedQuery(
    ['maintenance-dashboard'], 
    MaintenanceService.fetchUpcomingMaintenance,
    { priority: 'normal' }
  );

  // استعلام التنبيهات
  const { 
    data: alerts = [], 
    isLoading: alertsLoading 
  } = useOptimizedQuery(
    ['alerts-dashboard'], 
    NotificationService.fetchActiveAlerts,
    { priority: 'low' }
  );

  // حساب الإحصائيات المحسنة
  const dashboardStats = useMemo(() => {
    const vehicleStatusCounts = vehicles.reduce((acc, vehicle) => {
      acc[vehicle.status] = (acc[vehicle.status] || 0) + 1;
      return acc;
    }, { available: 0, rented: 0, maintenance: 0, out_of_service: 0 });

    const activeAgreements = agreements.filter(
      agreement => agreement.status === 'active'
    ).length;

    const pendingPayments = agreements.filter(
      agreement => agreement.status === 'pending_payment'
    ).length;

    const overduePayments = agreements.filter(
      agreement => agreement.status === 'overdue'
    ).length;

    return {
      totalVehicles: vehicles.length,
      totalCustomers: customers.length,
      activeAgreements,
      pendingPayments,
      overduePayments,
      maintenanceAlerts: maintenance.length,
      vehicleStatusCounts,
      totalRevenue: financialData.totalRevenue || 0,
      monthlyRevenue: financialData.monthlyRevenue || 0,
      recentActivities: activities.slice(0, 5),
      upcomingMaintenance: maintenance.slice(0, 5),
      alerts: alerts.slice(0, 3)
    };
  }, [vehicles, customers, agreements, financialData, activities, maintenance, alerts]);

  // حالة التحميل العامة
  const isLoading = vehiclesLoading || customersLoading || agreementsLoading;
  const hasError = vehiclesError;

  // مكون التحميل المحسن
  const LoadingFallback = useCallback(({ message = "جارٍ التحميل..." }) => (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  ), []);

  // عرض حالة الخطأ
  if (hasError) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-destructive">حدث خطأ أثناء تحميل البيانات</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* شريط حالة الاتصال */}
      {!isOnline && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-700">
                أنت في وضع عدم الاتصال. البيانات قد لا تكون محدثة.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="إجمالي المركبات"
          value={dashboardStats.totalVehicles}
          icon={Car}
          color="blue"
          isLoading={isLoading}
        />
        <StatCard
          title="العملاء"
          value={dashboardStats.totalCustomers}
          icon={Users}
          color="green"
          isLoading={isLoading}
        />
        <StatCard
          title="العقود النشطة"
          value={dashboardStats.activeAgreements}
          icon={FileText}
          color="purple"
          isLoading={isLoading}
        />
        <StatCard
          title="الدفعات المعلقة"
          value={dashboardStats.pendingPayments}
          icon={DollarSign}
          color="orange"
          isLoading={isLoading}
        />
        <StatCard
          title="الدفعات المتأخرة"
          value={dashboardStats.overduePayments}
          icon={AlertCircle}
          color="red"
          isLoading={isLoading}
        />
        <StatCard
          title="تنبيهات الصيانة"
          value={dashboardStats.maintenanceAlerts}
          icon={Wrench}
          color="yellow"
          isLoading={isLoading}
        />
      </div>

      {/* المحتوى الرئيسي */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* الرسوم البيانية */}
        <Card>
          <CardHeader>
            <CardTitle>حالة الأسطول</CardTitle>
          </CardHeader>
          <CardContent>
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback message="جارٍ تحميل الرسم البياني..." />}>
                <VehicleStatusChart data={dashboardStats.vehicleStatusCounts} />
              </Suspense>
            </ErrorBoundary>
          </CardContent>
        </Card>

        {/* الأنشطة الحديثة */}
        <Card>
          <CardHeader>
            <CardTitle>الأنشطة الحديثة</CardTitle>
          </CardHeader>
          <CardContent>
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback message="جارٍ تحميل الأنشطة..." />}>
                <RecentActivities activities={dashboardStats.recentActivities} />
              </Suspense>
            </ErrorBoundary>
          </CardContent>
        </Card>
      </div>

      {/* الإجراءات السريعة */}
      <Card>
        <CardHeader>
          <CardTitle>الإجراءات السريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback message="جارٍ تحميل الإجراءات..." />}>
              <QuickActions />
            </Suspense>
          </ErrorBoundary>
        </CardContent>
      </Card>

      {/* التحليلات المتقدمة */}
      <Card>
        <CardHeader>
          <CardTitle>التحليلات المتقدمة</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback message="جارٍ تحميل التحليلات..." />}>
              <AdvancedAnalyticsPanel />
            </Suspense>
          </ErrorBoundary>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperOptimizedDashboard; 