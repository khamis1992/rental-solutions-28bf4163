
import React, { useState, lazy, Suspense } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import DashboardStats from '@/components/dashboard/DashboardStats';
import { LayoutDashboard, RefreshCw } from 'lucide-react';
import { CustomButton } from '@/components/ui/custom-button';
import { useDashboardData } from '@/hooks/use-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/contexts/TranslationContext';
import { getDirectionalFlexClass } from '@/utils/rtl-utils';
import { lazyLoad, DefaultLoadingComponent } from '@/utils/lazy-loading';

// Lazy load heavy components
const RevenueChart = lazyLoad(
  () => import('@/components/dashboard/RevenueChart'),
  DefaultLoadingComponent,
  'Loading revenue chart...'
);

const VehicleStatusChart = lazyLoad(
  () => import('@/components/dashboard/VehicleStatusChart'),
  DefaultLoadingComponent,
  'Loading vehicle status...'
);

const RecentActivity = lazyLoad(
  () => import('@/components/dashboard/RecentActivity'),
  DefaultLoadingComponent,
  'Loading recent activity...'
);

// Suppress Supabase schema cache errors more comprehensively
if (typeof window !== 'undefined') {
  // Override console.error to filter out specific error messages
  const originalConsoleError = console.error;
  console.error = function(...args) {
    // Filter out all errors about relationships in schema cache
    if (args[0] && typeof args[0] === 'string' && 
        args[0].includes('schema cache')) {
      return; // Suppress all schema cache related errors
    }
    // Pass all other errors to the original console.error
    originalConsoleError.apply(console, args);
  };
}

const Dashboard = () => {
  const { stats, revenue, activity, isLoading, isError, error } = useDashboardData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { t } = useI18nTranslation();
  const { isRTL } = useTranslation();
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    
    // Use a timeout to prevent rapid refreshes
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  return (
    <PageContainer
      title={t('dashboard.title')}
      description={t('dashboard.description')}
    >
      <SectionHeader
        title={t('dashboard.title')}
        description={t('dashboard.description')}
        icon={LayoutDashboard}
        actions={
          <CustomButton 
            size="sm" 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className={`${getDirectionalFlexClass()} icon-text-spacing`}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className={isRTL ? 'mr-2' : 'ml-2'}>
              {isRefreshing ? t('dashboard.refreshing') : t('dashboard.refresh')}
            </span>
          </CustomButton>
        }
      />
      
      <div className="space-y-6">
        {isLoading ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <Skeleton className="h-96" />
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <Skeleton className="h-96" />
            </div>
            
            <Skeleton className="h-96" />
          </>
        ) : isError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {t('common.loading')}
            {error && <p className="text-sm mt-1">{error.toString()}</p>}
          </div>
        ) : (
          <>
            {/* Stats are critical, render them directly */}
            <DashboardStats stats={stats} />
            
            {/* Using lazy-loaded components for heavy sections */}
            <div className="grid grid-cols-1 gap-6 section-transition">
              <Suspense fallback={<Skeleton className="h-96" />}>
                <VehicleStatusChart data={stats?.vehicleStats} />
              </Suspense>
            </div>
            
            <div className="grid grid-cols-1 gap-6 section-transition">
              <Suspense fallback={<Skeleton className="h-96" />}>
                <RevenueChart data={revenue} fullWidth={true} />
              </Suspense>
            </div>
            
            <Suspense fallback={<Skeleton className="h-96" />}>
              <RecentActivity activities={activity} />
            </Suspense>
          </>
        )}
      </div>
    </PageContainer>
  );
};

export default Dashboard;
