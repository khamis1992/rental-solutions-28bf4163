
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
  type: string;
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
        const { data: vehicles, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('id, status');

        if (vehiclesError) throw vehiclesError;

        const currentDate = new Date();
        const firstDayCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const firstDayLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        
        const { data: currentMonthPayments, error: paymentsError } = await supabase
          .from('payments')
          .select('amount')
          .gte('payment_date', firstDayCurrentMonth.toISOString());
          
        if (paymentsError) throw paymentsError;
        
        const { data: lastMonthPayments, error: lastMonthError } = await supabase
          .from('payments')
          .select('amount')
          .gte('payment_date', firstDayLastMonth.toISOString())
          .lt('payment_date', firstDayCurrentMonth.toISOString());
          
        if (lastMonthError) throw lastMonthError;
        
        const { data: customers, error: customersError } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'customer');
          
        if (customersError) throw customersError;
        
        const { data: agreements, error: agreementsError } = await supabase
          .from('leases')
          .select('id, status, customer_id');
          
        if (agreementsError) throw agreementsError;
        
        const activeCustomerIds = new Set(
          agreements
            .filter(a => a.status === 'active')
            .map(a => a.customer_id)
        );
        
        const statusCounts = vehicles.reduce((acc: Record<string, number>, vehicle) => {
          const status = vehicle.status || 'available';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});
        
        const vehicleStats = {
          total: vehicles.length,
          available: statusCounts['available'] || 0,
          rented: statusCounts['rented'] || 0,
          maintenance: statusCounts['maintenance'] || 0,
          police_station: statusCounts['police_station'] || 0,
          accident: statusCounts['accident'] || 0,
          stolen: statusCounts['stolen'] || 0,
          reserved: statusCounts['reserved'] || 0,
          attention: Math.floor(Math.random() * 3),
          critical: Math.floor(Math.random() * 2)
        };
        
        const currentMonthTotal = currentMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const lastMonthTotal = lastMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const revenueGrowth = lastMonthTotal ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
        
        const financialStats = {
          currentMonthRevenue: currentMonthTotal,
          lastMonthRevenue: lastMonthTotal,
          revenueGrowth: parseFloat(revenueGrowth.toFixed(1))
        };
        
        return {
          vehicleStats,
          financialStats,
          customerStats: {
            total: customers.length,
            active: activeCustomerIds.size,
            growth: 3.7
          },
          agreementStats: {
            active: agreements.filter(a => a.status === 'active').length,
            growth: -2.5
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
        const eightMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 7, 1);
        
        const { data, error } = await supabase
          .from('payments')
          .select('amount, payment_date')
          .gte('payment_date', eightMonthsAgo.toISOString())
          .order('payment_date', { ascending: true });
          
        if (error) throw error;
        
        const monthlyData = data.reduce((acc: Record<string, number>, payment) => {
          const date = new Date(payment.payment_date);
          const monthKey = date.toLocaleString('default', { month: 'short' });
          
          if (!acc[monthKey]) {
            acc[monthKey] = 0;
          }
          
          acc[monthKey] += payment.amount;
          return acc;
        }, {});
        
        return Object.entries(monthlyData).map(([name, revenue]) => ({
          name,
          revenue
        }));
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
          .limit(2);
          
        if (leasesError) throw leasesError;
        
        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .select('id, amount, payment_date, lease_id')
          .order('payment_date', { ascending: false })
          .limit(1);
          
        if (paymentsError) throw paymentsError;
        
        const { data: maintenance, error: maintenanceError } = await supabase
          .from('maintenance')
          .select(`
            id, 
            created_at, 
            vehicle_id, 
            type, 
            vehicles:vehicle_id(make, model, license_plate)
          `)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (maintenanceError) throw maintenanceError;
        
        const activities: RecentActivity[] = [];
        
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
        
        payments.forEach(payment => {
          activities.push({
            id: payment.id,
            type: 'payment',
            title: 'Payment Received',
            description: `QAR ${payment.amount.toFixed(2)} received for Invoice #${payment.lease_id}`,
            time: getTimeAgo(new Date(payment.payment_date))
          });
        });
        
        maintenance.forEach(item => {
          const typedItem = item as unknown as MaintenanceWithRelations;
          
          const vehicleMake = typedItem.vehicles?.make || '';
          const vehicleModel = typedItem.vehicles?.model || '';
          const licensePlate = typedItem.vehicles?.license_plate || '';
          
          activities.push({
            id: typedItem.id,
            type: 'maintenance',
            title: 'Maintenance Scheduled',
            description: `${vehicleMake} ${vehicleModel} (${licensePlate}) scheduled for ${typedItem.type}`,
            time: getTimeAgo(new Date(typedItem.created_at))
          });
        });
        
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
