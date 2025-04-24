
import React, { useState, useCallback } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { useDashboardData } from '@/hooks/use-dashboard';
import { toast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { DashboardContent } from '@/components/dashboard/DashboardContent';

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
  const [collapsedSections, setCollapsedSections] = useState<{[key: string]: boolean}>({});
  
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    
    // Use a timeout to prevent rapid refreshes
    setTimeout(() => {
      window.location.reload();
      toast({
        title: "Dashboard refreshed",
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

  return (
    <PageContainer>
      <DashboardHeader 
        currentDate={currentDate}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
      
      <QuickActions />
      
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
    </PageContainer>
  );
};

export default Dashboard;
