
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle, VehicleStatus } from '@/types/vehicle';
import { hasData } from '@/utils/database-type-helpers';

interface VehicleTypeDistribution {
  type: string;
  count: number;
  avgDailyRate: number;
}

interface FleetStats {
  totalVehicles: number;
  activeVehicles: number;
  rentalRate: number;
}

export const useFleetReport = () => {
  // Fetch vehicles data
  const { data: vehicles = [], isLoading, error } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      // Need to cast here to make TypeScript happy
      return (data || []) as Vehicle[];
    }
  });

  // Get distribution by vehicle type
  const getVehicleTypeDistribution = (): VehicleTypeDistribution[] => {
    const distribution: Record<string, { count: number; totalRate: number }> = {};

    vehicles.forEach((vehicle) => {
      const type = vehicle.vehicleType?.name || 'Unknown';
      
      if (!distribution[type]) {
        distribution[type] = { count: 0, totalRate: 0 };
      }
      
      distribution[type].count += 1;
      distribution[type].totalRate += vehicle.rent_amount || 0;
    });

    return Object.entries(distribution).map(([type, { count, totalRate }]) => ({
      type,
      count,
      avgDailyRate: count > 0 ? totalRate / count : 0
    }));
  };

  // Get active rentals count
  const getActiveRentals = () => {
    return vehicles.filter(v => v.status === 'rented').length;
  };

  // Fetch rental information
  const { data: rentals = [] } = useQuery({
    queryKey: ['rentals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leases')
        .select(`
          id,
          vehicle_id,
          customer_id,
          profiles:customer_id(
            full_name,
            email,
            phone_number,
            nationality
          )
        `)
        .eq('status', 'active' as any);

      if (error) {
        console.error('Error fetching rentals:', error);
        return [];
      }

      // Safely process the data with type checking
      return (data || [])
        .filter(lease => lease !== null)
        .map(lease => {
          const profiles = lease?.profiles;
          const profileData = Array.isArray(profiles) && profiles.length > 0 
            ? profiles[0] 
            : typeof profiles === 'object' && profiles 
              ? profiles 
              : null;
              
          return {
            vehicleId: lease?.vehicle_id,
            customerId: lease?.customer_id,
            customerName: profileData?.full_name || 'Unknown',
            customerEmail: profileData?.email || '',
            customerPhone: profileData?.phone_number || ''
          };
        })
        .filter(item => item !== null);
    }
  });

  // Fetch maintenance expenses
  const { data: maintenanceExpenses = [] } = useQuery({
    queryKey: ['maintenance-expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance')
        .select('id, cost, vehicle_id')
        .gte('created_at', new Date(new Date().setDate(new Date().getDate() - 30)).toISOString());

      if (error) {
        console.error('Error fetching maintenance expenses:', error);
        return [];
      }

      return (data || []).map(item => ({
        id: item.id,
        cost: item.cost || 0,
        vehicleId: item.vehicle_id
      }));
    }
  });

  // Calculate fleet stats
  const fleetStats: FleetStats = {
    totalVehicles: vehicles.length,
    activeVehicles: getActiveRentals(),
    rentalRate: vehicles.reduce((sum, v) => sum + (v.rent_amount || 0), 0) / (vehicles.length || 1)
  };

  // Calculate vehicle type distribution
  const vehiclesByType = getVehicleTypeDistribution();

  return {
    vehicles,
    fleetStats,
    vehiclesByType,
    isLoading,
    error,
    getVehicleTypeDistribution,
    getActiveRentals,
    rentals,
    maintenanceExpenses
  };
};
