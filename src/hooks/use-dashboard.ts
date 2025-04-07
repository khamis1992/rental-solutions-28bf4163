
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

// Function to fetch dashboard data using individual queries instead of RPC
async function fetchAllDashboardData(): Promise<{
  stats: DashboardStats;
  revenue: { name: string; revenue: number }[];
  activity: RecentActivity[];
}> {
  try {
    // 1. Get vehicle stats
    const { data: vehicleStatsData, error: vehicleStatsError } = await supabase
      .from('vehicles')
      .select('status')
      .eq('is_test_data', false);
      
    if (vehicleStatsError) throw vehicleStatsError;
    
    const vehicleStats = {
      total: vehicleStatsData.length,
      available: vehicleStatsData.filter(v => v.status === 'available').length,
      rented: vehicleStatsData.filter(v => v.status === 'rented').length,
      maintenance: vehicleStatsData.filter(v => v.status === 'maintenance').length,
      police_station: vehicleStatsData.filter(v => v.status === 'police_station').length,
      accident: vehicleStatsData.filter(v => v.status === 'accident').length,
      stolen: vehicleStatsData.filter(v => v.status === 'stolen').length,
      reserved: vehicleStatsData.filter(v => v.status === 'reserve').length,
      attention: vehicleStatsData.filter(v => v.status === 'maintenance').length,
      critical: vehicleStatsData.filter(v => ['accident', 'stolen'].includes(v.status)).length
    };
    
    // 2. Get financial stats
    const currentMonth = new Date();
    const startOfCurrentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    
    const lastMonth = new Date(currentMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const startOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const endOfLastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);
    
    // Current month revenue
    const { data: currentMonthData, error: currentMonthError } = await supabase
      .from('unified_payments')
      .select('amount_paid')
      .gte('payment_date', startOfCurrentMonth.toISOString())
      .eq('type', 'Income');
      
    if (currentMonthError) throw currentMonthError;
    
    const currentMonthRevenue = currentMonthData.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0);
    
    // Last month revenue
    const { data: lastMonthData, error: lastMonthError } = await supabase
      .from('unified_payments')
      .select('amount_paid')
      .gte('payment_date', startOfLastMonth.toISOString())
      .lt('payment_date', startOfCurrentMonth.toISOString())
      .eq('type', 'Income');
      
    if (lastMonthError) throw lastMonthError;
    
    const lastMonthRevenue = lastMonthData.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0);
    
    // Calculate growth
    const revenueGrowth = lastMonthRevenue === 0 
      ? (currentMonthRevenue > 0 ? 100 : 0)
      : Math.round(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);
    
    // 3. Get customer stats
    const { data: customerData, error: customerError } = await supabase
      .from('profiles')
      .select('status')
      .eq('role', 'customer');
      
    if (customerError) throw customerError;
    
    const customerTotal = customerData.length;
    const customerActive = customerData.filter(c => c.status === 'active').length;
    
    // Simplified growth calculation (in a real app, would need to compare with previous period)
    const customerGrowth = 5; // Placeholder value
    
    // 4. Get agreement stats
    const { data: agreementData, error: agreementError } = await supabase
      .from('leases')
      .select('status');
      
    if (agreementError) throw agreementError;
    
    const agreementActive = agreementData.filter(a => a.status === 'active').length;
    
    // Simplified growth calculation (in a real app, would need to compare with previous period)
    const agreementGrowth = 3; // Placeholder value
    
    // 5. Get revenue data for chart
    const { data: revenueData, error: revenueError } = await supabase
      .from('unified_payments')
      .select('amount_paid, payment_date')
      .eq('type', 'Income')
      .gte('payment_date', new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 7, 1).toISOString());
      
    if (revenueError) throw revenueError;
    
    // Group by month and sum
    const revenueByMonth: Record<string, number> = {};
    revenueData.forEach(payment => {
      if (!payment.payment_date) return;
      
      const date = new Date(payment.payment_date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const monthName = date.toLocaleString('default', { month: 'short' });
      
      const key = monthName;
      
      if (!revenueByMonth[key]) {
        revenueByMonth[key] = 0;
      }
      
      revenueByMonth[key] += payment.amount_paid || 0;
    });
    
    const revenueChartData = Object.entries(revenueByMonth).map(([name, revenue]) => ({
      name,
      revenue
    }));
    
    // 6. Get recent activity
    const recentActivity: RecentActivity[] = [];
    
    // Recent rentals
    const { data: rentalData, error: rentalError } = await supabase
      .from('leases')
      .select(`
        id, 
        created_at, 
        customer_id, 
        vehicle_id, 
        profiles!customer_id(full_name), 
        vehicles!vehicle_id(make, model, license_plate)
      `)
      .order('created_at', { ascending: false })
      .limit(3);
      
    if (rentalError) throw rentalError;
    
    if (rentalData) {
      rentalData.forEach((lease) => {
        const profiles = lease.profiles as { full_name: string } | null;
        const vehicles = lease.vehicles as { make: string; model: string; license_plate: string } | null;
        
        recentActivity.push({
          id: lease.id,
          type: 'rental',
          title: 'New Rental',
          description: `${profiles?.full_name || 'Customer'} rented ${vehicles?.make || ''} ${vehicles?.model || ''} (${vehicles?.license_plate || ''})`,
          time: formatTimeAgo(new Date(lease.created_at))
        });
      });
    }
    
    // Recent payments
    const { data: paymentData, error: paymentError } = await supabase
      .from('unified_payments')
      .select('id, lease_id, amount_paid, payment_date')
      .eq('type', 'Income')
      .order('payment_date', { ascending: false })
      .limit(3);
      
    if (paymentError) throw paymentError;
    
    paymentData.forEach(payment => {
      if (payment.payment_date) {
        recentActivity.push({
          id: payment.id,
          type: 'payment',
          title: 'Payment Received',
          description: `QAR ${Math.round((payment.amount_paid || 0) * 100) / 100} received for lease #${payment.lease_id}`,
          time: formatTimeAgo(new Date(payment.payment_date))
        });
      }
    });
    
    // Recent maintenance
    const { data: maintenanceData, error: maintenanceError } = await supabase
      .from('maintenance')
      .select(`
        id, 
        created_at, 
        vehicle_id, 
        maintenance_type, 
        vehicles!vehicle_id(make, model, license_plate)
      `)
      .order('created_at', { ascending: false })
      .limit(2);
      
    if (maintenanceError) throw maintenanceError;
    
    if (maintenanceData) {
      maintenanceData.forEach((maintenance) => {
        const vehicles = maintenance.vehicles as { make: string; model: string; license_plate: string } | null;
        
        recentActivity.push({
          id: maintenance.id,
          type: 'maintenance',
          title: 'Maintenance Scheduled',
          description: `${vehicles?.make || ''} ${vehicles?.model || ''} (${vehicles?.license_plate || ''}) scheduled for ${maintenance.maintenance_type}`,
          time: formatTimeAgo(new Date(maintenance.created_at))
        });
      });
    }
    
    // Sort by time
    recentActivity.sort((a, b) => {
      const timeA = parseTimeAgo(a.time);
      const timeB = parseTimeAgo(b.time);
      return timeA - timeB;
    });
    
    // Construct the stats object
    const stats: DashboardStats = {
      vehicleStats,
      financialStats: {
        currentMonthRevenue,
        lastMonthRevenue,
        revenueGrowth
      },
      customerStats: {
        total: customerTotal,
        active: customerActive,
        growth: customerGrowth
      },
      agreementStats: {
        active: agreementActive,
        growth: agreementGrowth
      }
    };
    
    return {
      stats,
      revenue: revenueChartData,
      activity: recentActivity
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
function formatTimeAgo(date: Date): string {
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
