import { useQuery } from '@tanstack/react-query';
import { fetchDashboardData } from '@/lib/data-fetching';

// Define types for dashboard data
interface DashboardData {
  totalRevenue: number;
  newCustomers: number;
  activeVehicles: number;
  totalAgreements: number;
  recentAgreements: RecentAgreement[];
  revenueBreakdown: RevenueBreakdown[];
  vehiclePerformance: VehiclePerformance[];
}

interface RecentAgreement {
  id: string;
  agreementNumber: string;
  status: string;
  startDate: string;
  endDate: string;
  customer: {
    id: string;
    fullName: string;
  };
  vehicle: {
    id: string;
    make: string;
    model: string;
    licensePlate: string;
  };
}

interface RevenueBreakdown {
  type: string;
  amount: number;
}

interface VehiclePerformance {
  vehicleId: string;
  revenue: number;
}

// Add a utility to safely access properties
const safeGet = <T>(obj: any, key: string, defaultValue: T): T => {
  if (!obj || typeof obj !== 'object') return defaultValue;
  return (key in obj ? obj[key] : defaultValue) as T;
};

// Update the transformData function to use the safeGet utility
const transformData = (data: any) => {
  if (!data) return null;
  
  // Transform recent agreements
  const recentAgreements = (data.recent_agreements || []).map((agreement: any) => ({
    id: agreement.id,
    agreementNumber: safeGet(agreement, 'agreement_number', ''),
    status: safeGet(agreement, 'status', ''),
    startDate: safeGet(agreement, 'start_date', ''),
    endDate: safeGet(agreement, 'end_date', ''),
    customer: {
      id: safeGet(agreement, 'customer_id', ''),
      fullName: safeGet(agreement.profiles, 'full_name', 'Unknown Customer'),
    },
    vehicle: {
      id: safeGet(agreement, 'vehicle_id', ''),
      make: safeGet(agreement.vehicles, 'make', ''),
      model: safeGet(agreement.vehicles, 'model', ''),
      licensePlate: safeGet(agreement.vehicles, 'license_plate', ''),
    },
  }));

  // Transform revenue breakdown
  const revenueBreakdown = (data.revenue_breakdown || []).map((item: any) => ({
    type: safeGet(item, 'type', 'Unknown'),
    amount: safeGet(item, 'amount', 0),
  }));

  // Transform vehicle performance
  const vehiclePerformance = (data.vehicle_performance || []).map((item: any) => ({
    vehicleId: safeGet(item, 'vehicle_id', 'Unknown'),
    revenue: safeGet(item, 'revenue', 0),
  }));

  return {
    totalRevenue: safeGet(data, 'total_revenue', 0),
    newCustomers: safeGet(data, 'new_customers', 0),
    activeVehicles: safeGet(data, 'active_vehicles', 0),
    totalAgreements: safeGet(data, 'total_agreements', 0),
    recentAgreements: recentAgreements,
    revenueBreakdown: revenueBreakdown,
    vehiclePerformance: vehiclePerformance,
  };
};

export const useDashboard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const dashboardData = await fetchDashboardData();
      return transformData(dashboardData);
    },
  });

  return {
    data: data as DashboardData | null,
    isLoading,
    error,
  };
};
