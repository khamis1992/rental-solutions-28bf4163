
import React, { useState } from 'react';
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
import { toast } from '@/hooks/use-toast';

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
  
  // Get current month for display
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    
    // Use a timeout to prevent rapid refreshes
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  return (
    <PageContainer>
      <SectionHeader
        title="Dashboard"
        description={`Overview of your rental operations - ${currentMonth}`}
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
            <DashboardStats stats={stats} />
            
            <div className="grid grid-cols-1 gap-6 section-transition">
              <VehicleStatusChart data={stats?.vehicleStats} />
            </div>
            
            <div className="grid grid-cols-1 gap-6 section-transition">
              <RevenueChart data={revenue} fullWidth={true} />
            </div>
            
            <RecentActivity activities={activity} />
          </>
        )}
      </div>
    </PageContainer>
  );
};

export default Dashboard;
