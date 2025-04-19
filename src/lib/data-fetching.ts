import { supabase } from '@/integrations/supabase/client';
import { callRpcFunction } from '@/utils/rpc-helpers';

// Dashboard data fetching
export const fetchDashboardData = async () => {
  try {
    return await callRpcFunction('get_dashboard_data');
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return null;
  }
};

// Vehicle stats data fetching
export const fetchVehicleStats = async () => {
  try {
    return await callRpcFunction('get_vehicle_stats');
  } catch (error) {
    console.error('Error fetching vehicle stats:', error);
    return null;
  }
};

// Revenue data fetching
export const fetchRevenueData = async () => {
  try {
    return await callRpcFunction('get_revenue_data');
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    return null;
  }
};

// Recent activity fetching
export const fetchRecentActivity = async () => {
  try {
    return await callRpcFunction('get_recent_activity');
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return null;
  }
};
