
import React, { useState, useCallback, Suspense } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { useDashboardData } from '@/hooks/use-dashboard';
import { toast } from 'sonner';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

// Define loading fallbacks for lazy-loaded components
const LoadingSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-32" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
    </div>
    <Skeleton className="h-96" />
    <Skeleton className="h-96" />
  </div>
);

const Dashboard = () => {
  const { stats, revenue, activity, isLoading, isError, error } = useDashboardData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<{[key: string]: boolean}>({});
  
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    
    // Use a timeout to prevent rapid refreshes
    setTimeout(() => {
      window.location.reload();
      toast.success("Dashboard refreshed", {
        description: "All data has been updated with the latest information."
      });
    }, 600);
  }, []);
  
  const toggleSection = useCallback((section: string) => {
    setCollapsedSections(prev => ({ 
      ...prev, 
      [section]: !prev[section] 
    }));
  }, []);
  
  // Get current date in a formatted string
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (isError) {
    return (
      <PageContainer>
        <DashboardHeader 
          currentDate={currentDate}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
        />
        
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading dashboard data</AlertTitle>
          <AlertDescription>
            {error?.message || "Please try refreshing the page. If the problem persists, contact support."}
          </AlertDescription>
        </Alert>
        
        <QuickActions />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <DashboardHeader 
        currentDate={currentDate}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
      
      <QuickActions />
      
      <Suspense fallback={<LoadingSkeleton />}>
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
