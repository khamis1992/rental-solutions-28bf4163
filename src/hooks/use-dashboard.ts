// @ts-nocheck
/* eslint-disable */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/hooks/use-api';
import { VehicleStatus } from '@/types/vehicle';
import { CacheManager, useCachedData } from '@/lib/cache-utils';

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
        const cachedStats = CacheManager.get<DashboardStats>('dashboardStats');
        if (cachedStats) {
          return cachedStats;
        }

        const { data: vehicles, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('id, status');

        if (vehiclesError) throw vehiclesError;

        const currentDate = new Date();
        const firstDayCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const firstDayLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        
        const { data: currentMonthPayments, error: paymentsError } = await supabase
          .from('unified_payments')
          .select('amount_paid')
          .gte('payment_date', firstDayCurrentMonth.toISOString());
          
        if (paymentsError) throw paymentsError;
        
        const { data: lastMonthPayments, error: lastMonthError } = await supabase
          .from('unified_payments')
          .select('amount_paid')
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
          
          attention: statusCounts['maintenance'] || 0,
          critical: (statusCounts['accident'] || 0) + (statusCounts['stolen'] || 0)
        };
        
        const currentMonthTotal = currentMonthPayments.reduce((sum, payment) => {
          return sum + (payment.amount_paid || 0);
        }, 0);
        
        const lastMonthTotal = lastMonthPayments.reduce((sum, payment) => {
          return sum + (payment.amount_paid || 0);
        }, 0);
        
        const revenueGrowth = lastMonthTotal ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
        
        const financialStats = {
          currentMonthRevenue: currentMonthTotal,
          lastMonthRevenue: lastMonthTotal,
          revenueGrowth: parseFloat(revenueGrowth.toFixed(1))
        };
        
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
        
        const lastMonthNewCustomersSafe = lastMonthNewCustomers || [];
        const twoMonthsAgoNewCustomersSafe = twoMonthsAgoNewCustomers || [];
        const customerGrowth = twoMonthsAgoNewCustomersSafe.length ? 
          ((lastMonthNewCustomersSafe.length - twoMonthsAgoNewCustomersSafe.length) / twoMonthsAgoNewCustomersSafe.length) * 100 : 
          (lastMonthNewCustomersSafe.length > 0 ? 100 : 0);
        
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
        
        const lastMonthNewAgreementsSafe = lastMonthNewAgreements || [];
        const twoMonthsAgoNewAgreementsSafe = twoMonthsAgoNewAgreements || [];
        const agreementGrowth = twoMonthsAgoNewAgreementsSafe.length ? 
          ((lastMonthNewAgreementsSafe.length - twoMonthsAgoNewAgreementsSafe.length) / twoMonthsAgoNewAgreementsSafe.length) * 100 : 
          (lastMonthNewAgreementsSafe.length > 0 ? 100 : 0);
        
        const stats = {
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
        
        CacheManager.set('dashboardStats', stats, 5 * 60 * 1000);
        return stats;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const revenueQuery = useQuery<Array<{ name: string; revenue: number }>>({
    queryKey: ['dashboard', 'revenue'],
    queryFn: async (): Promise<Array<{ name: string; revenue: number }>> => {
      try {
        const cachedRevenue = CacheManager.get<Array<{name: string; revenue: number}>>(
          'dashboardRevenue'
        );
        if (cachedRevenue) {
          return cachedRevenue;
        }

        const currentDate = new Date();
        const eightMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 7, 1);
        
        const { data, error } = await supabase
          .from('unified_payments')
          .select('amount_paid, payment_date')
          .gte('payment_date', eightMonthsAgo.toISOString())
          .order('payment_date', { ascending: true });
          
        if (error) throw error;
        
        const monthlyData = data.reduce((acc: Record<string, number>, payment) => {
          const date = new Date(payment.payment_date);
          const monthKey = date.toLocaleString('default', { month: 'short' });
          
          if (!acc[monthKey]) {
            acc[monthKey] = 0;
          }
          
          acc[monthKey] += payment.amount_paid || 0;
          return acc;
        }, {});
        
        const result = Object.entries(monthlyData).map(([name, revenue]) => ({
          name,
          revenue: revenue as number
        }));
        
        CacheManager.set('dashboardRevenue', result, 5 * 60 * 1000);
        return result;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const activityQuery = useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: async (): Promise<RecentActivity[]> => {
      try {
        const cachedActivity = CacheManager.get<RecentActivity[]>('dashboardActivity');
        if (cachedActivity) {
          return cachedActivity;
        }

        // Fixed: Removed redundant table names in select clauses
        const { data: leases, error: leasesError } = await supabase
          .from('leases')
          .select(`
            id, 
            created_at, 
            customer_id, 
            vehicle_id, 
            profiles(full_name), 
            vehicles(make, model, license_plate)
          `)
          .order('created_at', { ascending: false })
          .limit(3);
          
        if (leasesError) throw leasesError;
        
        const { data: payments, error: paymentsError } = await supabase
          .from('unified_payments')
          .select('id, amount, amount_paid, payment_date, lease_id')
          .order('payment_date', { ascending: false })
          .limit(3);
          
        if (paymentsError) throw paymentsError;
        
        // Fixed: Removed redundant table names in select clauses
        const { data: maintenance, error: maintenanceError } = await supabase
          .from('maintenance')
          .select(`
            id, 
            created_at, 
            vehicle_id, 
            maintenance_type, 
            vehicles(make, model, license_plate)
          `)
          .order('created_at', { ascending: false })
          .limit(2);
          
        if (maintenanceError) throw maintenanceError;
        
        const activities: RecentActivity[] = [];
        
        leases.forEach(lease => {
          const typedLease = lease as unknown as LeaseWithRelations;
          
          const customerName = typedLease.profiles?.full_name || 'عميل';
          const vehicleMake = typedLease.vehicles?.make || '';
          const vehicleModel = typedLease.vehicles?.model || '';
          const licensePlate = typedLease.vehicles?.license_plate || '';
          
          activities.push({
            id: typedLease.id,
            type: 'rental',
            title: 'تأجير جديد',
            description: `${customerName} استأجر ${vehicleMake} ${vehicleModel} (${licensePlate})`,
            time: getTimeAgo(new Date(typedLease.created_at))
          });
        });
        
        payments.forEach(payment => {
          const paymentAmount = payment.amount_paid || payment.amount;
          
          activities.push({
            id: payment.id,
            type: 'payment',
            title: 'دفعة مستلمة',
            description: `${paymentAmount.toFixed(2)} ر.ق تم استلامها للعقد #${payment.lease_id}`,
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
            title: 'صيانة مجدولة',
            description: `${vehicleMake} ${vehicleModel} (${licensePlate}) مجدولة لـ ${typedItem.maintenance_type}`,
            time: getTimeAgo(new Date(typedItem.created_at))
          });
        });
        
        const result = activities.sort((a, b) => {
          const timeA = parseTimeAgo(a.time);
          const timeB = parseTimeAgo(b.time);
          return timeA - timeB;
        }).slice(0, 5);
        
        CacheManager.set('dashboardActivity', result, 3 * 60 * 1000);
        return result;
      } catch (error) {
        handleError(error);
        return [];
      }
    },
    staleTime: 3 * 60 * 1000,
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

  if (diffInMinutes < 1) {
    return 'الآن';
  } else if (diffInMinutes < 60) {
    return `منذ ${diffInMinutes} ${diffInMinutes === 1 ? 'دقيقة' : 'دقائق'}`;
  } else if (diffInHours < 24) {
    return `منذ ${diffInHours} ${diffInHours === 1 ? 'ساعة' : diffInHours === 2 ? 'ساعتين' : 'ساعات'}`;
  } else {
    return `منذ ${diffInDays} ${diffInDays === 1 ? 'يوم' : diffInDays === 2 ? 'يومين' : 'أيام'}`;
  }
}

function parseTimeAgo(timeAgo: string): number {
  // Handle both Arabic and English time formats for compatibility
  if (timeAgo === 'الآن') return 0;
  
  const arabicMatch = timeAgo.match(/منذ\s+(\d+)\s+(\S+)/);
  if (arabicMatch) {
    const [_, value, unit] = arabicMatch;
    const numValue = parseInt(value);
    
    if (unit.includes('دقيقة') || unit.includes('دقائق')) return numValue;
    if (unit.includes('ساعة') || unit.includes('ساعتين') || unit.includes('ساعات')) return numValue * 60;
    if (unit.includes('يوم') || unit.includes('يومين') || unit.includes('أيام')) return numValue * 60 * 24;
  }
  
  // Fallback to English parsing for backwards compatibility
  const englishMatch = timeAgo.match(/(\d+)\s+(\w+)/);
  if (englishMatch) {
    const [_, value, unit] = englishMatch;
    const numValue = parseInt(value);
    
    if (unit.includes('minute')) return numValue;
    if (unit.includes('hour')) return numValue * 60;
    if (unit.includes('day')) return numValue * 60 * 24;
  }
  
  return 9999;
}
