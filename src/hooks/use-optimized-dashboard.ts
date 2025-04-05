
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDashboardData } from './use-dashboard';
import { useState, useEffect } from 'react';
import performanceMonitor from '@/utils/performance-monitor';

/**
 * This hook optimizes dashboard data loading by:
 * 1. First returning cached data if available
 * 2. Then loading critical data (stats) quickly
 * 3. Then loading less critical data (charts, activity) in the background
 */
export const useOptimizedDashboardData = () => {
  const queryClient = useQueryClient();
  const [loadPriority, setLoadPriority] = useState<'critical' | 'all'>('critical');
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  
  // Get all dashboard data using the original hook
  const dashboardData = useDashboardData();
  
  // Check if we have cached data
  const cachedStats = queryClient.getQueryData(['dashboard', 'stats']);
  const cachedRevenue = queryClient.getQueryData(['dashboard', 'revenue']);
  const cachedActivity = queryClient.getQueryData(['dashboard', 'activity']);
  
  const hasCachedData = !!cachedStats || !!cachedRevenue || !!cachedActivity;

  // After critical data is loaded, request the rest
  useEffect(() => {
    // Measure initial critical data load time
    performanceMonitor.startMeasure('dashboard_critical_load');
    
    if (loadPriority === 'critical' && dashboardData.stats) {
      // Critical data loaded, record the metric
      performanceMonitor.endMeasure('dashboard_critical_load', true);
      
      // Set a small delay to prioritize rendering of critical content first
      const timer = setTimeout(() => {
        performanceMonitor.startMeasure('dashboard_full_load');
        setLoadPriority('all');
      }, 300);
      
      return () => clearTimeout(timer);
    }
    
    // Measure full load time
    if (loadPriority === 'all' && dashboardData.revenue && dashboardData.activity) {
      performanceMonitor.endMeasure('dashboard_full_load', true);
    }
  }, [dashboardData.isLoading, dashboardData.stats, dashboardData.revenue, dashboardData.activity, loadPriority]);
  
  // Determine what to return based on current state
  const result = {
    ...dashboardData,
    // If we have cached data, use it while loading fresh data
    stats: dashboardData.stats || (cachedStats as typeof dashboardData.stats),
    revenue: loadPriority === 'all' ? (dashboardData.revenue || (cachedRevenue as typeof dashboardData.revenue)) : undefined,
    activity: loadPriority === 'all' ? (dashboardData.activity || (cachedActivity as typeof dashboardData.activity)) : undefined,
    // Let the UI know if we're using cached data temporarily
    isUsingCachedData: dashboardData.isLoading && hasCachedData,
    loadPriority,
    refresh: () => setLastRefresh(Date.now())
  };
  
  return result;
};

export default useOptimizedDashboardData;
