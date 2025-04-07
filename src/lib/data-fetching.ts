
import { supabase } from './supabase';
import { handleApiError } from '@/hooks/use-api';

/**
 * Utility for optimized dashboard data fetching
 * This handles batched queries and data transformations
 */
export const dashboardDataService = {
  /**
   * Fetches all dashboard data in a single request using database functions/views
   */
  async fetchDashboardData() {
    try {
      // This will be replaced by a proper RPC call once the function is created
      const { data, error } = await supabase.rpc('get_dashboard_data');
      
      if (error) throw error;
      return data;
    } catch (error) {
      handleApiError(error, 'Error fetching dashboard data');
      throw error;
    }
  },
  
  /**
   * Fetches vehicle statistics using an optimized database view
   */
  async fetchVehicleStats() {
    try {
      // This will be replaced by a view once it's created
      const { data, error } = await supabase.rpc('get_vehicle_stats');
      
      if (error) throw error;
      return data;
    } catch (error) {
      handleApiError(error, 'Error fetching vehicle statistics');
      throw error;
    }
  },
  
  /**
   * Fetches revenue data using an optimized database view
   */
  async fetchRevenueData() {
    try {
      // This will be replaced by a view once it's created
      const { data, error } = await supabase.rpc('get_revenue_data');
      
      if (error) throw error;
      return data;
    } catch (error) {
      handleApiError(error, 'Error fetching revenue data');
      throw error;
    }
  },
  
  /**
   * Fetches recent activity using an optimized database view
   */
  async fetchRecentActivity() {
    try {
      // This will be replaced by a view once it's created
      const { data, error } = await supabase.rpc('get_recent_activity');
      
      if (error) throw error;
      return data;
    } catch (error) {
      handleApiError(error, 'Error fetching recent activities');
      throw error;
    }
  }
};

/**
 * A utility function to batch multiple queries together and return their results
 * @param queries - Array of query execution functions 
 * @returns Object with keys matching the provided queryKeys and values as the query results
 */
export async function batchQueries<T extends Record<string, unknown>>(
  queries: Array<{ key: keyof T; queryFn: () => Promise<unknown> }>
): Promise<T> {
  try {
    const results = await Promise.all(
      queries.map(async ({ key, queryFn }) => {
        try {
          const result = await queryFn();
          return { key, result, error: null };
        } catch (error) {
          return { key, result: null, error };
        }
      })
    );
    
    return results.reduce((acc, { key, result, error }) => {
      acc[key as keyof T] = (error ? null : result) as T[keyof T];
      return acc;
    }, {} as T);
  } catch (error) {
    handleApiError(error, 'Error in batch query execution');
    throw error;
  }
}
