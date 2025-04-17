
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
  const { data: vehicles = [], isLoading, error, refetch } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        // Cast to unknown first, then to Vehicle[] to satisfy TypeScript
        return ((data || []) as unknown) as Vehicle[];
      } catch (error) {
        console.error('Error fetching vehicles:', error);
        throw error;
      }
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
      try {
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

        if (!data) {
          return [];
        }

        // Type safe conversion of data, with null checks
        return data.filter(item => item !== null).map(lease => {
          // Initialize with default values
          const result = {
            vehicleId: '',
            customerId: '',
            customerName: 'Unknown',
            customerEmail: '',
            customerPhone: ''
          };
          
          // Only try to access properties if lease is not null
          if (lease) {
            result.vehicleId = lease.vehicle_id || '';
            result.customerId = lease.customer_id || '';
            
            // Check if profiles exists and has the right type before accessing its properties
            if (lease.profiles && typeof lease.profiles === 'object') {
              // Handle both array and object forms
              const profileData = Array.isArray(lease.profiles) && lease.profiles.length > 0
                ? lease.profiles[0]
                : lease.profiles;
                
              if (profileData) {
                result.customerName = profileData.full_name || 'Unknown';
                result.customerEmail = profileData.email || '';
                result.customerPhone = profileData.phone_number || '';
              }
            }
          }
          
          return result;
        });
      } catch (err) {
        console.error("Error in rental query:", err);
        return [];
      }
    }
  });

  // Fetch maintenance expenses
  const { data: maintenanceExpenses = [] } = useQuery({
    queryKey: ['maintenance-expenses'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('maintenance')
          .select('id, cost, vehicle_id')
          .gte('created_at', new Date(new Date().setDate(new Date().getDate() - 30)).toISOString());

        if (error) {
          console.error('Error fetching maintenance expenses:', error);
          return [];
        }

        if (!data) {
          return [];
        }

        return data.filter(item => item !== null).map(item => ({
          id: item?.id || '',
          cost: item?.cost || 0,
          vehicleId: item?.vehicle_id || ''
        }));
      } catch (err) {
        console.error("Error fetching maintenance expenses:", err);
        return [];
      }
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
