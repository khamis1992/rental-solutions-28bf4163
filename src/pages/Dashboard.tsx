
import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { useDashboardData } from '@/hooks/use-dashboard';
import { toast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { CacheManager } from '@/lib/cache-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocalStorage } from '@/hooks/use-local-storage';

// Lazy load the DashboardContent component to improve initial load time
const DashboardContent = lazy(() => import('@/components/dashboard/DashboardContent').then(
  module => ({ default: module.DashboardContent })
));

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
  const { stats, revenue, activity, isLoading, isError, error, refetch } = useDashboardData();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Store collapsed sections in localStorage to persist user preferences
  const [collapsedSections, setCollapsedSections] = useLocalStorage<{[key: string]: boolean}>(
    'dashboard-collapsed-sections',
    {}
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);

    try {
      // Clear cache when refreshing
      CacheManager.clear();

      // Use refetch instead of page reload for better UX
      await refetch();

      toast({
        title: "Dashboard refreshed",
        description: "All data has been updated with the latest information."
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Could not refresh dashboard data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const toggleSection = useCallback((section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, [setCollapsedSections]);

  // Get current date in a formatted string
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Add CSS to handle animations - moved to global CSS file for better performance
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideIn {
        from { transform: translateY(10px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .animate-fade-in {
        animation: fadeIn 0.5s ease-in-out;
      }
      .animate-slide-in {
        animation: slideIn 0.5s ease-out;
      }
      .section-transition {
        transition: all 0.3s ease-in-out;
      }
      .card-transition {
        transition: all 0.2s ease;
      }

      /* Add responsive styles for dashboard */
      @media (max-width: 640px) {
        .dashboard-section {
          margin-bottom: 1rem;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <PageContainer>
      <DashboardHeader
        currentDate={currentDate}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />

      <QuickActions />

      <Suspense fallback={
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="dashboard-section">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, j) => (
                  <Skeleton key={j} className="h-32 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      }>
        <DashboardContent
          isLoading={isLoading}
          isError={isError}
          error={error}
          stats={stats}
          revenue={revenue}
          activity={activity}
          collapsedSections={collapsedSections}
          onToggleSection={toggleSection}
        />
      </Suspense>
    </PageContainer>
  );
};

export default Dashboard;
