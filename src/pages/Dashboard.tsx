
import React, { useState, useCallback, useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { useDashboardData } from '@/hooks/use-dashboard';
import { toast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { CacheManager } from '@/lib/cache-utils';
import { logOperation } from '@/utils/monitoring-utils';

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
    
    if (args[0]) {
      const errorMessage = typeof args[0] === 'string' ? args[0] : 'Console error';
      const errorDetails = args.length > 1 ? args.slice(1) : undefined;
      
      logOperation(
        'dashboard.error', 
        'error', 
        { details: errorDetails }, 
        errorMessage
      );
    }
    
    // Pass all other errors to the original console.error for backward compatibility
    originalConsoleError.apply(console, args);
  };
}

const Dashboard = () => {
  const { stats, revenue, activity, isLoading, isError, error } = useDashboardData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<{[key: string]: boolean}>({});
  
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    
    // Clear cache when refreshing
    CacheManager.clear();
    
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

  // Add CSS to handle animations
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
