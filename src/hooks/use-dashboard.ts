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

export function useDashboardData() {
  const statsQuery = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async (): Promise<DashboardStats> => {
      try {
        // Fetch vehicle stats with real counts by status
        const { data: vehicles, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('id, status');

        if (vehiclesError) throw vehiclesError;

        const currentDate = new Date();
        const firstDayCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const firstDayLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        
        // Fetch real payment data for current month
        const { data: currentMonthPayments, error: paymentsError } = await supabase
          .from('unified_payments')
          .select('amount, amount_paid')
          .gte('payment_date', firstDayCurrentMonth.toISOString());
          
        if (paymentsError) throw paymentsError;
        
        // Fetch real payment data for last month for growth calculation
        const { data: lastMonthPayments, error: lastMonthError } = await supabase
          .from('unified_payments')
          .select('amount, amount_paid')
          .gte('payment_date', firstDayLastMonth.toISOString())
          .lt('payment_date', firstDayCurrentMonth.toISOString());
          
        if (lastMonthError) throw lastMonthError;
        
        // Get real customer count
        const { data: customers, error: customersError } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'customer');
          
        if (customersError) throw customersError;
        
        // Get active agreements count
        const { data: agreements, error: agreementsError } = await supabase
          .from('leases')
          .select('id, status, customer_id');
          
        if (agreementsError) throw agreementsError;
        
        // Calculate active customers based on active agreements
        const activeCustomerIds = new Set(
          agreements
            .filter(a => a.status === 'active')
            .map(a => a.customer_id)
        );
        
        // Calculate vehicle status counts from real data
        const statusCounts = vehicles.reduce((acc: Record<string, number>, vehicle) => {
          const status = vehicle.status || 'available';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});
        
        // Create vehicle stats object with real data
        const vehicleStats = {
          total: vehicles.length,
          available: statusCounts['available'] || 0,
          rented: statusCounts['rented'] || 0,
          maintenance: statusCounts['maintenance'] || 0,
          police_station: statusCounts['police_station'] || 0,
          accident: statusCounts['accident'] || 0,
          stolen: statusCounts['stolen'] || 0,
          reserved: statusCounts['reserved'] || 0,
          
          // Critical vehicles - can be calculated from maintenance records with high priority
          // For now we'll use a simple calculation from maintenance and accident counts
          attention: statusCounts['maintenance'] || 0,
          critical: (statusCounts['accident'] || 0) + (statusCounts['stolen'] || 0)
        };
        
        // Calculate financial stats from real payment data
        const currentMonthTotal = currentMonthPayments.reduce((sum, payment) => {
          const amountToAdd = payment.amount_paid || payment.amount || 0;
          return sum + amountToAdd;
        }, 0);
        
        const lastMonthTotal = lastMonthPayments.reduce((sum, payment) => {
          const amountToAdd = payment.amount_paid || payment.amount || 0;
          return sum + amountToAdd;
        }, 0);
        
        // Calculate real growth percentage
        const revenueGrowth = lastMonthTotal ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
        
        const financialStats = {
          currentMonthRevenue: currentMonthTotal,
          lastMonthRevenue: lastMonthTotal,
          revenueGrowth: parseFloat(revenueGrowth.toFixed(1))
        };
        
        // Customer growth calculation would need historical data
        // For now we'll calculate it based on recently added customers
        const twoMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1);
        
        const { data: lastMonthNewCustomers } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'customer')
          .gte('created_at', firstDayLastMonth.toISOString())
          .lt('created_at', firstDayCurrentMonth.toISOString());
        
        const { data: twoMonthsAgoNewCustomers } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'customer')
          .gte('created_at', twoMonthsAgo.toISOString())
          .lt('created_at', firstDayLastMonth.toISOString());
        
        // Calculate customer growth
        const customerGrowth = twoMonthsAgoNewCustomers.length ? 
          ((lastMonthNewCustomers.length - twoMonthsAgoNewCustomers.length) / twoMonthsAgoNewCustomers.length) * 100 : 
          (lastMonthNewCustomers.length > 0 ? 100 : 0);
        
        // Same for agreements
        const { data: lastMonthNewAgreements } = await supabase
          .from('leases')
          .select('id')
          .gte('created_at', firstDayLastMonth.toISOString())
          .lt('created_at', firstDayCurrentMonth.toISOString());
        
        const { data: twoMonthsAgoNewAgreements } = await supabase
          .from('leases')
          .select('id')
          .gte('created_at', twoMonthsAgo.toISOString())
          .lt('created_at', firstDayLastMonth.toISOString());
        
        // Calculate agreement growth
        const agreementGrowth = twoMonthsAgoNewAgreements.length ? 
          ((lastMonthNewAgreements.length - twoMonthsAgoNewAgreements.length) / twoMonthsAgoNewAgreements.length) * 100 : 
          (lastMonthNewAgreements.length > 0 ? 100 : 0);
        
        return {
          vehicleStats,
          financialStats,
          customerStats: {
            total: customers.length,
            active: activeCustomerIds.size,
            growth: parseFloat(customerGrowth.toFixed(1))
          },
          agreementStats: {
            active: agreements.filter(a => a.status === 'active').length,
            growth: parseFloat(agreementGrowth.toFixed(1))
          }
        };
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    }
  });

  const revenueQuery = useQuery({
    queryKey: ['dashboard', 'revenue'],
    queryFn: async () => {
      try {
        const currentDate = new Date();
        const firstDayCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        
        // Get real payment data for the current month only
        const { data, error } = await supabase
          .from('unified_payments')
          .select('amount, amount_paid, payment_date')
          .gte('payment_date', firstDayCurrentMonth.toISOString())
          .order('payment_date', { ascending: true });
          
        if (error) throw error;
        
        // Calculate the total revenue for the current month
        const monthlyTotal = data.reduce((total, payment) => {
          const paymentAmount = payment.amount_paid || payment.amount || 0;
          return total + paymentAmount;
        }, 0);
        
        // Return the data in the expected format with the current month only
        const currentMonth = currentDate.toLocaleString('default', { month: 'short' });
        return [{
          name: currentMonth,
          revenue: monthlyTotal
        }];
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    }
  });

  const activityQuery = useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: async (): Promise<RecentActivity[]> => {
      try {
        // Get recent rentals/leases
        const { data: leases, error: leasesError } = await supabase
          .from('leases')
          .select(`
            id, 
            created_at, 
            customer_id, 
            vehicle_id, 
            profiles:customer_id(full_name), 
            vehicles:vehicle_id(make, model, license_plate)
          `)
          .order('created_at', { ascending: false })
          .limit(3);
          
        if (leasesError) throw leasesError;
        
        // Get recent payments
        const { data: payments, error: paymentsError } = await supabase
          .from('unified_payments')
          .select('id, amount, amount_paid, payment_date, lease_id')
          .order('payment_date', { ascending: false })
          .limit(3);
          
        if (paymentsError) throw paymentsError;
        
        // Get recent maintenance
        const { data: maintenance, error: maintenanceError } = await supabase
          .from('maintenance')
          .select(`
            id, 
            created_at, 
            vehicle_id, 
            maintenance_type, 
            vehicles:vehicle_id(make, model, license_plate)
          `)
          .order('created_at', { ascending: false })
          .limit(2);
          
        if (maintenanceError) throw maintenanceError;
        
        const activities: RecentActivity[] = [];
        
        // Process leases to activities
        leases.forEach(lease => {
          const typedLease = lease as unknown as LeaseWithRelations;
          
          const customerName = typedLease.profiles?.full_name || 'Customer';
          const vehicleMake = typedLease.vehicles?.make || '';
          const vehicleModel = typedLease.vehicles?.model || '';
          const licensePlate = typedLease.vehicles?.license_plate || '';
          
          activities.push({
            id: typedLease.id,
            type: 'rental',
            title: 'New Rental',
            description: `${customerName} rented ${vehicleMake} ${vehicleModel} (${licensePlate})`,
            time: getTimeAgo(new Date(typedLease.created_at))
          });
        });
        
        // Process payments to activities
        payments.forEach(payment => {
          // Use payment_amount if it exists, otherwise use amount
          const paymentAmount = payment.amount_paid || payment.amount;
          
          activities.push({
            id: payment.id,
            type: 'payment',
            title: 'Payment Received',
            description: `QAR ${paymentAmount.toFixed(2)} received for lease #${payment.lease_id}`,
            time: getTimeAgo(new Date(payment.payment_date))
          });
        });
        
        // Process maintenance to activities
        maintenance.forEach(item => {
          const typedItem = item as unknown as MaintenanceWithRelations;
          
          const vehicleMake = typedItem.vehicles?.make || '';
          const vehicleModel = typedItem.vehicles?.model || '';
          const licensePlate = typedItem.vehicles?.license_plate || '';
          
          activities.push({
            id: typedItem.id,
            type: 'maintenance',
            title: 'Maintenance Scheduled',
            description: `${vehicleMake} ${vehicleModel} (${licensePlate}) scheduled for ${typedItem.maintenance_type}`,
            time: getTimeAgo(new Date(typedItem.created_at))
          });
        });
        
        // Sort and return recent activities
        return activities.sort((a, b) => {
          const timeA = parseTimeAgo(a.time);
          const timeB = parseTimeAgo(b.time);
          return timeA - timeB;
        }).slice(0, 5);
      } catch (error) {
        handleApiError(error);
        return [];
      }
    }
  });

  return {
    stats: statsQuery.data,
    revenue: revenueQuery.data || [],
    activity: activityQuery.data || [],
    isLoading: statsQuery.isLoading || revenueQuery.isLoading || activityQuery.isLoading,
    isError: statsQuery.isError || revenueQuery.isError || activityQuery.isError,
    error: statsQuery.error || revenueQuery.error || activityQuery.error
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
