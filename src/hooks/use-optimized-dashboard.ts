
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDashboardData } from './use-dashboard';
import { useState, useEffect } from 'react';

/**
 * This hook optimizes dashboard data loading by:
 * 1. First returning cached data if available
 * 2. Then loading critical data (stats) quickly
 * 3. Then loading less critical data (charts, activity) in the background
 */
export const useOptimizedDashboardData = () => {
  const queryClient = useQueryClient();
  const [loadPriority, setLoadPriority] = useState<'critical' | 'all'>('critical');
  
  // Get all dashboard data using the original hook - removing the incorrect parameter
  const dashboardData = useDashboardData();
  
  // Check if we have cached data
  const cachedStats = queryClient.getQueryData(['dashboard', 'stats']);
  const cachedRevenue = queryClient.getQueryData(['dashboard', 'revenue']);
  const cachedActivity = queryClient.getQueryData(['dashboard', 'activity']);

  // After critical data is loaded, request the rest
  useEffect(() => {
    if (loadPriority === 'critical' && !dashboardData.isLoading) {
      // Set a small delay to prioritize rendering of critical content first
      const timer = setTimeout(() => {
        setLoadPriority('all');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [dashboardData.isLoading, loadPriority]);
  
  // Determine what to return based on current state
  const result = {
    ...dashboardData,
    // If we have cached data, use it while loading fresh data
    stats: dashboardData.stats || (cachedStats as typeof dashboardData.stats),
    revenue: dashboardData.revenue || (cachedRevenue as typeof dashboardData.revenue),
    activity: dashboardData.activity || (cachedActivity as typeof dashboardData.activity),
    // Let the UI know if we're using cached data temporarily
    isUsingCachedData: dashboardData.isLoading && (!!cachedStats || !!cachedRevenue || !!cachedActivity),
    loadPriority
  };
  
  return result;
};

export default useOptimizedDashboardData;
