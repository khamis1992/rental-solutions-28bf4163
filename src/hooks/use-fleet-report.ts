
import { useQuery } from '@tanstack/react-query';
import { fetchVehicles } from '@/lib/vehicles/vehicle-api';
import { Vehicle, VehicleStatus } from '@/types/vehicle';

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
    const typeName = vehicle.vehicleType?.name || 'Unspecified';
    const dailyRate = vehicle.dailyRate || vehicle.vehicleType?.daily_rate || 0;
    
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

export const useFleetReport = () => {
  const { data: vehicles = [], isLoading, error } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => fetchVehicles(),
  });

  // Calculate utilization rate
  const fleetUtilizationRate = calculateUtilizationRate(vehicles);
  
  // Group vehicles by type
  const vehiclesByType = getVehiclesByType(vehicles);
  
  // Get status counts
  const statusCounts = getStatusCounts(vehicles);
  
  // Calculate fleet statistics
  const fleetStats = {
    totalVehicles: vehicles.length,
    activeRentals: vehicles.filter(v => v.status === 'rented').length,
    averageDailyRate: vehicles.reduce((acc, v) => acc + (v.dailyRate || 0), 0) / 
                      (vehicles.length || 1),
    maintenanceRequired: vehicles.filter(v => v.status === 'maintenance').length
  };

  return {
    vehicles,
    fleetStats,
    fleetUtilizationRate,
    vehiclesByType,
    statusCounts,
    isLoading,
    error
  };
};
