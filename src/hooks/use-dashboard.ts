import { useQuery, useQueries, UseQueryResult } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { handleApiError } from '@/hooks/use-api';
import { VehicleStatus } from '@/types/vehicle';
import { executeQuery } from '@/lib/supabase';

// Constants for caching and stale time
const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const CACHE_TIME = 30 * 60 * 1000; // 30 minutes

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

// Separate query functions for parallel execution
const fetchVehicleStats = async () => {
  const { data, error } = await executeQuery('dashboard-vehicles', () =>
    supabase.from('vehicles').select('id, status')
  );
  if (error) throw error;
  return data;
};

const fetchPayments = async (startDate: Date) => {
  const { data, error } = await executeQuery(`dashboard-payments-${startDate.toISOString()}`, () =>
    supabase
      .from('unified_payments')
      .select('amount_paid, payment_date')
      .gte('payment_date', startDate.toISOString())
  );
  if (error) throw error;
  return data;
};

const fetchCustomers = async () => {
  const { data, error } = await executeQuery('dashboard-customers', () =>
    supabase
      .from('profiles')
      .select('id, created_at')
      .eq('role', 'customer')
  );
  if (error) throw error;
  return data;
};

const fetchAgreements = async () => {
  const { data, error } = await executeQuery('dashboard-agreements', () =>
    supabase
      .from('leases')
      .select('id, status, customer_id, created_at')
  );
  if (error) throw error;
  return data;
};

const fetchRecentActivity = async () => {
  const [leases, payments, maintenance] = await Promise.all([
    executeQuery('dashboard-recent-leases', () =>
      supabase
        .from('leases')
        .select('id, created_at, customer_id, vehicle_id, profiles:customer_id(full_name), vehicles:vehicle_id(make, model, license_plate)')
        .order('created_at', { ascending: false })
        .limit(3)
    ),
    executeQuery('dashboard-recent-payments', () =>
      supabase
        .from('unified_payments')
        .select('id, amount, amount_paid, payment_date, lease_id')
        .order('payment_date', { ascending: false })
        .limit(3)
    ),
    executeQuery('dashboard-recent-maintenance', () =>
      supabase
        .from('maintenance')
        .select('id, created_at, vehicle_id, maintenance_type, vehicles:vehicle_id(make, model, license_plate)')
        .order('created_at', { ascending: false })
        .limit(2)
    )
  ]);

  return { leases: leases.data || [], payments: payments.data || [], maintenance: maintenance.data || [] };
};

// Prefetch function for initial data load
export const prefetchDashboardData = async () => {
  const currentDate = new Date();
  const firstDayCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

  await Promise.all([
    fetchVehicleStats(),
    fetchPayments(firstDayCurrentMonth),
    fetchCustomers(),
    fetchAgreements(),
    fetchRecentActivity()
  ]);
};

export function useDashboardData() {
  // Parallel queries for better performance
  const queries = useQueries({
    queries: [
      {
        queryKey: ['dashboard', 'vehicles'],
        queryFn: fetchVehicleStats,
        staleTime: STALE_TIME,
        cacheTime: CACHE_TIME
      },
      {
        queryKey: ['dashboard', 'payments'],
        queryFn: () => fetchPayments(new Date(new Date().getFullYear(), new Date().getMonth() - 7, 1)),
        staleTime: STALE_TIME,
        cacheTime: CACHE_TIME
      },
      {
        queryKey: ['dashboard', 'customers'],
        queryFn: fetchCustomers,
        staleTime: STALE_TIME,
        cacheTime: CACHE_TIME
      },
      {
        queryKey: ['dashboard', 'agreements'],
        queryFn: fetchAgreements,
        staleTime: STALE_TIME,
        cacheTime: CACHE_TIME
      },
      {
        queryKey: ['dashboard', 'activity'],
        queryFn: fetchRecentActivity,
        staleTime: STALE_TIME / 2, // More frequent updates for activity
        cacheTime: CACHE_TIME
      }
    ]
  });

  const [vehiclesQuery, paymentsQuery, customersQuery, agreementsQuery, activityQuery] = queries;

  // Process the data only when all queries are successful
  const processedData = React.useMemo(() => {
    if (queries.some(query => query.isLoading || query.isError)) return null;

    // Calculate stats using the fetched data
    const vehicleStats = calculateVehicleStats(vehiclesQuery.data);
    const financialStats = calculateFinancialStats(paymentsQuery.data);
    const customerStats = calculateCustomerStats(customersQuery.data);
    const agreementStats = calculateAgreementStats(agreementsQuery.data);
    const activities = processActivities(activityQuery.data);

    return {
      stats: {
        vehicleStats,
        financialStats,
        customerStats,
        agreementStats
      },
      revenue: calculateRevenueData(paymentsQuery.data),
      activity: activities
    };
  }, [queries.map(q => q.data)]);

  return {
    ...processedData,
    isLoading: queries.some(query => query.isLoading),
    isError: queries.some(query => query.isError),
    error: queries.find(query => query.error)?.error,
    refetch: () => Promise.all(queries.map(query => query.refetch()))
  };
}

// Helper functions for data processing
function calculateVehicleStats(vehicles: any[]) {
  const statusCounts = vehicles.reduce((acc: Record<string, number>, vehicle) => {
    const status = vehicle.status || 'available';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return {
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
}

function calculateFinancialStats(payments: any[]) {
  const currentDate = new Date();
  const firstDayCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const firstDayLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);

  const currentMonthTotal = payments
    .filter(payment => new Date(payment.payment_date) >= firstDayCurrentMonth)
    .reduce((sum, payment) => sum + (payment.amount_paid || 0), 0);

  const lastMonthTotal = payments
    .filter(payment => new Date(payment.payment_date) >= firstDayLastMonth && new Date(payment.payment_date) < firstDayCurrentMonth)
    .reduce((sum, payment) => sum + (payment.amount_paid || 0), 0);

  const revenueGrowth = lastMonthTotal ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  return {
    currentMonthRevenue: currentMonthTotal,
    lastMonthRevenue: lastMonthTotal,
    revenueGrowth: parseFloat(revenueGrowth.toFixed(1))
  };
}

function calculateCustomerStats(customers: any[]) {
  const currentDate = new Date();
  const firstDayCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const firstDayLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const twoMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1);

  const lastMonthNewCustomers = customers.filter(customer => new Date(customer.created_at) >= firstDayLastMonth && new Date(customer.created_at) < firstDayCurrentMonth);
  const twoMonthsAgoNewCustomers = customers.filter(customer => new Date(customer.created_at) >= twoMonthsAgo && new Date(customer.created_at) < firstDayLastMonth);

  const customerGrowth = twoMonthsAgoNewCustomers.length ? 
    ((lastMonthNewCustomers.length - twoMonthsAgoNewCustomers.length) / twoMonthsAgoNewCustomers.length) * 100 : 
    (lastMonthNewCustomers.length > 0 ? 100 : 0);

  return {
    total: customers.length,
    active: customers.filter(customer => customer.status === 'active').length,
    growth: parseFloat(customerGrowth.toFixed(1))
  };
}

function calculateAgreementStats(agreements: any[]) {
  const currentDate = new Date();
  const firstDayCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const firstDayLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const twoMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1);

  const lastMonthNewAgreements = agreements.filter(agreement => new Date(agreement.created_at) >= firstDayLastMonth && new Date(agreement.created_at) < firstDayCurrentMonth);
  const twoMonthsAgoNewAgreements = agreements.filter(agreement => new Date(agreement.created_at) >= twoMonthsAgo && new Date(agreement.created_at) < firstDayLastMonth);

  const agreementGrowth = twoMonthsAgoNewAgreements.length ? 
    ((lastMonthNewAgreements.length - twoMonthsAgoNewAgreements.length) / twoMonthsAgoNewAgreements.length) * 100 : 
    (lastMonthNewAgreements.length > 0 ? 100 : 0);

  return {
    active: agreements.filter(a => a.status === 'active').length,
    growth: parseFloat(agreementGrowth.toFixed(1))
  };
}

function processActivities(activityData: any) {
  const { leases, payments, maintenance } = activityData;

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
    const paymentAmount = payment.amount_paid || payment.amount;
    
    activities.push({
      id: payment.id,
      type: 'payment',
      title: 'Payment Received',
      description: `QAR ${paymentAmount.toFixed(2)} received for lease #${payment.lease_id}`,
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
      description: `${vehicleMake} ${vehicleModel} (${licensePlate}) scheduled for ${typedItem.maintenance_type}`,
      time: getTimeAgo(new Date(typedItem.created_at))
    });
  });

  return activities.sort((a, b) => {
    const timeA = parseTimeAgo(a.time);
    const timeB = parseTimeAgo(b.time);
    return timeA - timeB;
  }).slice(0, 5);
}

function calculateRevenueData(payments: any[]) {
  const currentDate = new Date();
  const eightMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 7, 1);

  const monthlyData = payments
    .filter(payment => new Date(payment.payment_date) >= eightMonthsAgo)
    .reduce((acc: Record<string, number>, payment) => {
      const date = new Date(payment.payment_date);
      const monthKey = date.toLocaleString('default', { month: 'short' });
      
      if (!acc[monthKey]) {
        acc[monthKey] = 0;
      }
      
      acc[monthKey] += payment.amount_paid || 0;
      return acc;
    }, {});

  return Object.entries(monthlyData).map(([name, revenue]) => ({
    name,
    revenue
  }));
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
