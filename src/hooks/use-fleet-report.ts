
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Vehicle, VehicleStatus } from '@/types/vehicle';
import { hasData, safeMapArray } from '@/utils/database-type-helpers';

interface VehicleTypeDistribution {
  type: string;
  count: number;
  avgDailyRate: number;
}

interface FleetStats {
  totalVehicles: number;
  activeVehicles: number;
  rentalRate: number;
  maintenanceRequired?: number;
  activeRentals?: number;
  averageDailyRate?: number;
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

      // Map data to Vehicle[] safely, filtering out null items
      return safeMapArray(data, vehicle => {
        if (!vehicle) return null;
        
        return {
          id: vehicle.id || '',
          make: vehicle.make || '',
          model: vehicle.model || '',
          license_plate: vehicle.license_plate || '',
          year: vehicle.year || 0,
          status: vehicle.status || 'available',
          rent_amount: vehicle.rent_amount || 0,
          dailyRate: vehicle.rent_amount || 0, // Map to dailyRate for compatibility
          currentCustomer: '', // Default value for compatibility
          // Safely spread remaining properties
          ...(vehicle as object)
        } as Vehicle;
      }).filter(Boolean) as Vehicle[];
    }
  });

  // Get distribution by vehicle type
  const getVehicleTypeDistribution = (): VehicleTypeDistribution[] => {
    const distribution: Record<string, { count: number; totalRate: number }> = {};

    vehicles.forEach((vehicle) => {
      // Safely access vehicleType using optional chaining
      const type = vehicle?.vehicleType?.name || 'Unknown';
      
      if (!distribution[type]) {
        distribution[type] = { count: 0, totalRate: 0 };
      }
      
      distribution[type].count += 1;
      distribution[type].totalRate += vehicle?.rent_amount || 0;
    });

    return Object.entries(distribution).map(([type, { count, totalRate }]) => ({
      type,
      count,
      avgDailyRate: count > 0 ? totalRate / count : 0
    }));
  };

  // Get active rentals count
  const getActiveRentals = () => {
    return vehicles.filter(v => v?.status === 'rented').length;
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

        // Safe mapping with proper null checks
        return safeMapArray(data, lease => {
          // Handle potential null values safely
          const vehicleId = lease?.vehicle_id;
          const customerId = lease?.customer_id;
          const profiles = lease?.profiles;
          
          // Safe access to profile data
          let fullName = 'Unknown';
          let email = '';
          let phone = '';
          
          if (profiles) {
            if (Array.isArray(profiles) && profiles.length > 0) {
              fullName = profiles[0]?.full_name || 'Unknown';
              email = profiles[0]?.email || '';
              phone = profiles[0]?.phone_number || '';
            } else if (typeof profiles === 'object') {
              fullName = (profiles as any)?.full_name || 'Unknown';
              email = (profiles as any)?.email || '';
              phone = (profiles as any)?.phone_number || '';
            }
          }
          
          return {
            vehicleId,
            customerId,
            customerName: fullName,
            customerEmail: email,
            customerPhone: phone
          };
        });
      } catch (err) {
        console.error("Error fetching rentals:", err);
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

        return safeMapArray(data, item => {
          return {
            id: item?.id || '',
            cost: item?.cost || 0,
            vehicleId: item?.vehicle_id || ''
          };
        });
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
    rentalRate: vehicles.reduce((sum, v) => sum + (v?.rent_amount || 0), 0) / (vehicles.length || 1),
    maintenanceRequired: vehicles.filter(v => v?.status === 'maintenance').length,
    activeRentals: getActiveRentals(),
    averageDailyRate: vehicles.reduce((sum, v) => sum + (v?.rent_amount || 0), 0) / (vehicles.length || 1)
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
