import React, { useState, memo, Suspense, lazy } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import DashboardStats from '@/components/dashboard/DashboardStats';
import { LayoutDashboard, RefreshCw } from 'lucide-react';
import { CustomButton } from '@/components/ui/custom-button';
import { useDashboardData } from '@/hooks/use-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { ErrorBoundary } from 'react-error-boundary';

// Lazy load heavy components
const RevenueChart = lazy(() => import('@/components/dashboard/RevenueChart'));
const VehicleStatusChart = lazy(() => import('@/components/dashboard/VehicleStatusChart'));
const RecentActivity = lazy(() => import('@/components/dashboard/RecentActivity'));

// Memoized components for better performance
const MemoizedDashboardStats = memo(DashboardStats);
const MemoizedRevenueChart = memo(RevenueChart);
const MemoizedVehicleStatusChart = memo(VehicleStatusChart);
const MemoizedRecentActivity = memo(RecentActivity);

// Error Fallback Component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
    <p>Something went wrong:</p>
    <pre className="text-sm mt-1">{error.message}</pre>
    <button
      onClick={resetErrorBoundary}
      className="mt-2 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200"
    >
      Try again
    </button>
  </div>
);

// Loading component
const LoadingDashboard = () => (
  <div className="space-y-6">
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
  </div>
);

const Dashboard = () => {
  const { stats, revenue, activity, isLoading, isError, error, refetch } = useDashboardData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success('Dashboard data refreshed');
    } catch (error) {
      toast.error('Failed to refresh dashboard data');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <PageContainer>
      <SectionHeader
        title="Dashboard"
        description="Overview of your rental operations"
        icon={LayoutDashboard}
        actions={
          <CustomButton 
            size="sm" 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </CustomButton>
        }
      />
      
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => {
          refetch();
        }}
      >
        <div className="space-y-6">
          {isLoading ? (
            <LoadingDashboard />
          ) : isError ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              Failed to load dashboard data. Please try again later.
              {error && <p className="text-sm mt-1">{error.toString()}</p>}
            </div>
          ) : (
            <>
              <MemoizedDashboardStats stats={stats} />
              
              <Suspense fallback={<Skeleton className="h-96" />}>
                <div className="grid grid-cols-1 gap-6 section-transition">
                  <MemoizedVehicleStatusChart data={stats?.vehicleStats} />
                </div>
              </Suspense>
              
              <Suspense fallback={<Skeleton className="h-96" />}>
                <div className="grid grid-cols-1 gap-6 section-transition">
                  <MemoizedRevenueChart data={revenue} fullWidth={true} />
                </div>
              </Suspense>
              
              <Suspense fallback={<Skeleton className="h-96" />}>
                <MemoizedRecentActivity activities={activity} />
              </Suspense>
            </>
          )}
        </div>
      </ErrorBoundary>
    </PageContainer>
  );
};

export default memo(Dashboard);
