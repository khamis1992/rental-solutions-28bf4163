import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle, VehicleStatus } from '@/types/vehicle';
import { hasData, hasProperty } from '@/utils/database-type-helpers';
import { VehicleTypeDistribution, FleetStats } from '@/types/fleet-report';

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
        
        // Return empty array if no data
        if (!data) {
          return [] as Vehicle[];
        }
        
        // Safely cast data to Vehicle[]
        return data as Vehicle[];
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
          .eq('status', 'active');

        if (error) {
          console.error('Error fetching rentals:', error);
          return [];
        }

        if (!data) {
          return [];
        }

        // Type safe conversion of data, with null checks
        return data.filter(lease => lease !== null).map(lease => {
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
            // Check for property existence before accessing
            if (hasProperty(lease, 'vehicle_id')) {
              result.vehicleId = String(lease.vehicle_id || '');
            }
            
            if (hasProperty(lease, 'customer_id')) {
              result.customerId = String(lease.customer_id || '');
            }
            
            // Handle profiles object safely
            const profileData = lease.profiles;
            if (profileData && typeof profileData === 'object') {
              // Handle the profile data whether it's an array or a single object
              const profile = Array.isArray(profileData) ? profileData[0] : profileData;
              
              if (profile) {
                result.customerName = String(profile.full_name || 'Unknown');
                result.customerEmail = String(profile.email || '');
                result.customerPhone = String(profile.phone_number || '');
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

        return data.filter(item => item !== null).map(item => {
          // Initialize with default values
          const result = {
            id: '',
            cost: 0,
            vehicleId: ''
          };
          
          // Only try to access properties if item is not null
          if (item) {
            // Check for property existence before accessing
            if (hasProperty(item, 'id')) {
              result.id = String(item.id || '');
            }
            
            if (hasProperty(item, 'cost')) {
              result.cost = Number(item.cost || 0);
            }
            
            if (hasProperty(item, 'vehicle_id')) {
              result.vehicleId = String(item.vehicle_id || '');
            }
          }
          
          return result;
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
    availableCount: vehicles.filter(v => v.status === 'available').length,
    maintenanceCount: vehicles.filter(v => v.status === 'maintenance').length,
    rentedCount: vehicles.filter(v => v.status === 'rented').length,
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
