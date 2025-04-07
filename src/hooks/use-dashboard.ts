
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { handleApiError } from '@/hooks/use-api';
import { VehicleStatus } from '@/types/vehicle';

export interface DashboardStats {
  vehicleStats: {
    total: number;
    available: number;
    rented: number;
    maintenance: number;
    police_station?: number;
    accident?: number;
    stolen?: number;
    reserved?: number;
    attention?: number;
    critical?: number;
  };
  financialStats: {
    currentMonthRevenue: number;
    lastMonthRevenue: number;
    revenueGrowth: number;
  };
  customerStats: {
    total: number;
    active: number;
    growth: number;
  };
  agreementStats: {
    active: number;
    growth: number;
  };
}

interface LeaseWithRelations {
  id: string;
  created_at: string;
  customer_id: string;
  vehicle_id: string;
  profiles: { full_name: string } | null;
  vehicles: { make: string; model: string; license_plate: string } | null;
}

interface MaintenanceWithRelations {
  id: string;
  created_at: string;
  vehicle_id: string;
  maintenance_type: string;
  vehicles: { make: string; model: string; license_plate: string } | null;
}

export interface RecentActivity {
  id: string;
  type: 'rental' | 'return' | 'payment' | 'maintenance' | 'fine';
  title: string;
  description: string;
  time: string;
}

// New function to fetch all dashboard data in a single batch operation
async function fetchAllDashboardData(): Promise<{
  stats: DashboardStats;
  revenue: { name: string; revenue: number }[];
  activity: RecentActivity[];
}> {
  try {
    // 1. Call the dashboard_data view/function (this will be created in Supabase)
    const { data: dashboardData, error: dashboardError } = await supabase
      .rpc('get_dashboard_data');
    
    if (dashboardError) throw dashboardError;
    
    // Parse and transform the returned data
    const stats: DashboardStats = dashboardData.stats;
    const revenue = dashboardData.revenue;
    const activity = dashboardData.activity;
    
    return {
      stats,
      revenue,
      activity
    };
  } catch (error) {
    handleApiError(error, 'Failed to load dashboard data');
    throw error;
  }
}

// Main dashboard data hook with optimized caching
export function useDashboardData() {
  // Single query for all dashboard data with proper caching
  const dashboardQuery = useQuery({
    queryKey: ['dashboard', 'all'],
    queryFn: fetchAllDashboardData,
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache persists for 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false, // Don't refetch when window is focused
    retry: 1, // Only retry once on failure
  });

  return {
    stats: dashboardQuery.data?.stats,
    revenue: dashboardQuery.data?.revenue || [],
    activity: dashboardQuery.data?.activity || [],
    isLoading: dashboardQuery.isLoading,
    isError: dashboardQuery.isError,
    error: dashboardQuery.error
  };
}

// Helper function to calculate time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  } else {
    return `${diffInDays} days ago`;
  }
}

// Helper function to parse time ago for sorting
function parseTimeAgo(timeAgo: string): number {
  const match = timeAgo.match(/(\d+)\s+(\w+)/);
  if (!match) return 9999;
  
  const [_, value, unit] = match;
  const numValue = parseInt(value);
  
  if (unit.includes('minute')) return numValue;
  if (unit.includes('hour')) return numValue * 60;
  if (unit.includes('day')) return numValue * 60 * 24;
  
  return 9999;
}
