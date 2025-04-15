
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Vehicle } from '@/types/vehicle';
import { castDbId } from '@/utils/database-type-helpers';

interface MonthlyExpense {
  month: string;
  total: number;
}

interface VehicleTypeDistribution {
  vehicleType: string;
  count: number;
}

export const useFleetReport = () => {
  const { data: vehicles, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*, vehicle_types(id, name, description)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching vehicles:', error);
        throw error;
      }

      return (data || []).map((vehicle: any) => {
        if (!vehicle) return null;
        
        return {
          ...vehicle,
          vehicleType: vehicle.vehicle_types
        } as Vehicle;
      }).filter(Boolean) as Vehicle[];
    }
  });

  const getVehicleTypeDistribution = (): VehicleTypeDistribution[] => {
    if (!vehicles) return [];
    
    const distribution: Record<string, number> = {};
    
    vehicles.forEach(vehicle => {
      const type = vehicle.vehicleType?.name || 'Unknown';
      distribution[type] = (distribution[type] || 0) + 1;
    });
    
    return Object.entries(distribution).map(([vehicleType, count]) => ({
      vehicleType,
      count
    }));
  };

  const getActiveRentals = () => {
    if (!vehicles) return 0;
    return vehicles.filter(v => v.status === 'rented').length;
  };

  const { data: rentals, isLoading: isLoadingRentals } = useQuery({
    queryKey: ['fleet-rentals'],
    queryFn: async () => {
      try {
        // First get all vehicles that are currently rented
        const rentedVehicleIds = vehicles
          ?.filter(v => v.status === 'rented')
          .map(v => v.id) || [];
        
        if (rentedVehicleIds.length === 0) {
          return [];
        }
        
        const { data, error } = await supabase
          .from('leases')
          .select(`
            vehicle_id,
            customer_id,
            profiles!inner(full_name, email, phone_number, nationality)
          `)
          .in('vehicle_id', rentedVehicleIds as any)
          .eq('status', 'active' as any);

        if (error) throw error;
        
        // Safely transform the data
        return (data || []).map(rental => {
          if (!rental || !rental.profiles) {
            return null;
          }
          
          const profile = Array.isArray(rental.profiles) && rental.profiles.length > 0 
            ? rental.profiles[0] 
            : rental.profiles;
            
          if (!profile) {
            return null;
          }
          
          return {
            vehicleId: rental.vehicle_id,
            customerId: rental.customer_id,
            customerName: profile.full_name || 'Unknown',
            customerEmail: profile.email || '',
            customerPhone: profile.phone_number || '',
          };
        }).filter(Boolean);
      } catch (error) {
        console.error('Error fetching rental info:', error);
        return [];
      }
    },
    enabled: !!vehicles && vehicles.some(v => v.status === 'rented')
  });

  // Get monthly maintenance expenses
  const { data: maintenanceExpenses, isLoading: isLoadingExpenses } = useQuery({
    queryKey: ['fleet-maintenance-expenses'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('maintenance')
          .select('cost, completed_date')
          .not('cost', 'is', null)
          .order('completed_date', { ascending: false });

        if (error) throw error;
        
        // Group by month and sum
        const monthlyExpenses: Record<string, number> = {};
        
        (data || []).forEach((expense: any) => {
          if (!expense || !expense.completed_date || !expense.cost) return;
          
          const date = new Date(expense.completed_date);
          const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          monthlyExpenses[monthYear] = (monthlyExpenses[monthYear] || 0) + Number(expense.cost);
        });
        
        // Convert to array format
        return Object.entries(monthlyExpenses).map(([month, total]) => ({
          month,
          total
        })).sort((a, b) => a.month.localeCompare(b.month));
      } catch (error) {
        console.error('Error fetching maintenance expenses:', error);
        return [];
      }
    }
  });

  return {
    vehicles,
    isLoading: isLoadingVehicles || isLoadingRentals || isLoadingExpenses,
    getVehicleTypeDistribution,
    getActiveRentals,
    rentals,
    maintenanceExpenses
  };
};
