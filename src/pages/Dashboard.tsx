
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import DashboardStats from '@/components/dashboard/DashboardStats';
import RevenueChart from '@/components/dashboard/RevenueChart';
import VehicleStatusChart from '@/components/dashboard/VehicleStatusChart';
import RecentActivity from '@/components/dashboard/RecentActivity';
import { LayoutDashboard, RefreshCw } from 'lucide-react';
import { CustomButton } from '@/components/ui/custom-button';
import { useDashboardData } from '@/hooks/use-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';

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

// Memoized dashboard components for better performance
const MemoizedDashboardStats = React.memo(DashboardStats);
const MemoizedRevenueChart = React.memo(RevenueChart);
const MemoizedVehicleStatusChart = React.memo(VehicleStatusChart);
const MemoizedRecentActivity = React.memo(RecentActivity);

const Dashboard = () => {
  const { 
    stats, 
    revenue, 
    activity, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useDashboardData();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMobile = useIsMobile();
  
  // Memoized refresh handler
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    refetch().finally(() => {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    });
  }, [refetch]);

  // Automatically refresh data when component mounts
  useEffect(() => {
    // Only fetch if data is stale (older than 5 minutes)
    const lastFetchTime = localStorage.getItem('dashboardLastFetch');
    const now = Date.now();
    if (!lastFetchTime || now - parseInt(lastFetchTime) > 5 * 60 * 1000) {
      refetch();
      localStorage.setItem('dashboardLastFetch', now.toString());
    }
  }, [refetch]);
  
  // Memoize the revenue data to prevent unnecessary chart re-renders
  const memoizedRevenueData = useMemo(() => revenue, [revenue]);

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
            Failed to load dashboard data. Please try again later.
            {error && <p className="text-sm mt-1">{error.toString()}</p>}
          </div>
        ) : (
          <>
            {/* Use memoized components to prevent unnecessary re-renders */}
            <MemoizedDashboardStats stats={stats} />
            
            <div className="grid grid-cols-1 gap-6 section-transition">
              <MemoizedVehicleStatusChart data={stats?.vehicleStats} />
            </div>
            
            <div className="grid grid-cols-1 gap-6 section-transition">
              <MemoizedRevenueChart 
                data={memoizedRevenueData} 
                fullWidth={true}
                showTooltip={!isMobile} // Hide tooltip on mobile for better performance
              />
            </div>
            
            <MemoizedRecentActivity activities={activity} />
          </>
        )}
      </div>
    </PageContainer>
  );
};

// Export memoized component to prevent unnecessary re-renders
export default React.memo(Dashboard);
