
import { useQuery } from '@tanstack/react-query';
import { fetchVehicles } from '@/lib/vehicles/vehicle-api';
import { Vehicle, VehicleStatus } from '@/types/vehicle';
import { supabase } from '@/integrations/supabase/client';
import { getResponseData } from '@/utils/supabase-type-helpers';

// Helper function to calculate utilization rate (based on status)
const calculateUtilizationRate = (vehicles: Vehicle[]) => {
  if (!vehicles.length) return 0;
  
  const rentedCount = vehicles.filter(v => v.status === 'rented').length;
  return Math.round((rentedCount / vehicles.length) * 100);
};

// Helper function to get vehicles grouped by type
const getVehiclesByType = (vehicles: Vehicle[]) => {
  const typeMap = new Map<string, {
    type: string,
    count: number,
    avgDailyRate: number,
    totalRevenue: number,
    vehicles: Vehicle[]
  }>();

  vehicles.forEach(vehicle => {
    const typeName = (vehicle as any).vehicleType?.name || 'Unspecified';
    const dailyRate = vehicle.dailyRate || (vehicle as any).vehicleType?.daily_rate || 0;
    
    if (!typeMap.has(typeName)) {
      typeMap.set(typeName, {
        type: typeName,
        count: 0,
        avgDailyRate: 0,
        totalRevenue: 0,
        vehicles: []
      });
    }
    
    const typeData = typeMap.get(typeName)!;
    typeData.count += 1;
    typeData.vehicles.push(vehicle);
    typeData.totalRevenue += dailyRate;
  });
  
  // Calculate average daily rate for each type
  return Array.from(typeMap.values()).map(typeData => ({
    ...typeData,
    avgDailyRate: typeData.totalRevenue / typeData.count
  }));
};

// Calculate status counts
const getStatusCounts = (vehicles: Vehicle[]) => {
  const statusMap: Record<string, number> = {
    available: 0,
    rented: 0,
    reserved: 0,
    maintenance: 0,
    other: 0
  };

  vehicles.forEach(vehicle => {
    if (vehicle.status && statusMap[vehicle.status] !== undefined) {
      statusMap[vehicle.status]++;
    } else {
      statusMap.other++;
    }
  });
  
  return statusMap;
};

// Fetch customer information for rented vehicles
const attachCustomerInfo = async (vehicles: Vehicle[]): Promise<Vehicle[]> => {
  // Get rented vehicles IDs
  const rentedVehicleIds = vehicles
    .filter(v => v.status === 'rented')
    .map(v => v.id);
  
  if (rentedVehicleIds.length === 0) {
    return vehicles;
  }

  try {
    // Fetch active leases for these vehicles
    const { data: leases, error } = await supabase
      .from('leases')
      .select('vehicle_id, customer_id, profiles:customer_id(full_name, email, phone_number)')
      .in('vehicle_id', rentedVehicleIds)
      .eq('status', 'active');

    if (error || !leases) {
      console.error('Error fetching customer information:', error);
      return vehicles;
    }

    // Map customer data to vehicles
    return vehicles.map(vehicle => {
      if (vehicle.status === 'rented') {
        const lease = leases.find(l => {
          if (typeof l === 'object' && l !== null) {
            return l.vehicle_id === vehicle.id;
          }
          return false;
        });
        
        if (lease && lease.profiles) {
          const profiles = lease.profiles;
          if (typeof profiles === 'object' && profiles !== null) {
            return {
              ...vehicle,
              currentCustomer: (profiles as any).full_name || '',
              customerEmail: (profiles as any).email || '',
              customerPhone: (profiles as any).phone_number || '',
              customerId: lease.customer_id
            };
          }
        }
      }
      return vehicle;
    });
  } catch (error) {
    console.error('Error in attachCustomerInfo:', error);
    return vehicles;
  }
};

export const useFleetReport = () => {
  const { data: fetchedVehicles = [], isLoading, error } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => fetchVehicles(),
  });

  // Fetch customer information and attach to vehicles
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles-with-customers', fetchedVehicles],
    queryFn: () => attachCustomerInfo(fetchedVehicles),
    enabled: fetchedVehicles.length > 0,
    initialData: fetchedVehicles,
  });

  // Calculate utilization rate
  const fleetUtilizationRate = calculateUtilizationRate(vehicles);
  
  // Group vehicles by type
  const vehiclesByType = getVehiclesByType(vehicles);
  
  // Get status counts
  const statusCounts = getStatusCounts(vehicles);
  
  // Prepare data for reports - MODIFIED to remove specified fields
  const reportData = vehicles.map(vehicle => ({
    license_plate: vehicle.license_plate,
    status: vehicle.status,
    customer_name: vehicle.currentCustomer || 'Not Assigned',
    // Fields removed: make, model, year, daily_rate, customer_contact
  }));
  
  // Calculate fleet statistics
  const fleetStats = {
    totalVehicles: vehicles.length,
    activeRentals: vehicles.filter(v => v.status === 'rented').length,
    averageDailyRate: vehicles.reduce((acc, v) => acc + (v.dailyRate || 0), 0) / 
                      (vehicles.length || 1),
    maintenanceRequired: vehicles.filter(v => v.status === 'maintenance').length
  };

  // Helper function to format currency
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'QAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  return {
    vehicles,
    fleetStats,
    fleetUtilizationRate,
    vehiclesByType,
    statusCounts,
    reportData,
    isLoading,
    error
  };
};
