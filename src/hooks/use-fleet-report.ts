
// Fixing use-fleet-report.ts to handle the 'type' property issue
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type Vehicle = {
  id: string;
  make?: string;
  model?: string;
  year?: number;
  license_plate?: string;
  color?: string;
  vehicle_type?: string; // Use this instead of 'type'
  status?: string;
  mileage?: number;
  created_at?: string;
  updated_at?: string;
  image_url?: string;
  rent_amount?: number;
  currentCustomer?: string; // Add for FleetReport.tsx
  dailyRate?: number; // Add for FleetReport.tsx
};

export type FleetReport = {
  totalVehicles: number;
  availableVehicles: number;
  rentedVehicles: number;
  maintenanceVehicles: number;
  vehiclesByType: Record<string, number>;
  vehiclesByStatus: Record<string, number>;
  vehiclesByMake: Record<string, number>;
  averageRentAmount: number;
  totalRentAmount: number;
  activeRentals: number; // Add for FleetReport.tsx
  maintenanceRequired: number; // Add for FleetReport.tsx
  averageDailyRate: number; // Add for FleetReport.tsx
};

// Add for FleetReport.tsx
export type VehicleTypeData = {
  type: string;
  count: number;
  avgDailyRate: number;
};

export const useFleetReport = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [report, setReport] = useState<FleetReport>({
    totalVehicles: 0,
    availableVehicles: 0,
    rentedVehicles: 0,
    maintenanceVehicles: 0,
    vehiclesByType: {},
    vehiclesByStatus: {},
    vehiclesByMake: {},
    averageRentAmount: 0,
    totalRentAmount: 0,
    activeRentals: 0, // Added for FleetReport.tsx
    maintenanceRequired: 0, // Added for FleetReport.tsx
    averageDailyRate: 0 // Added for FleetReport.tsx
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Computed vehicle by type data for FleetReport.tsx
  const vehiclesByType = useMemo(() => {
    const types: VehicleTypeData[] = [];
    if (report && report.vehiclesByType) {
      Object.entries(report.vehiclesByType).forEach(([type, count]) => {
        // Filter vehicles of this type
        const vehiclesOfType = vehicles.filter(v => v.vehicle_type === type);
        // Calculate average daily rate for this type
        const totalRate = vehiclesOfType.reduce((sum, v) => sum + (v.rent_amount || 0), 0);
        const avgRate = vehiclesOfType.length > 0 ? totalRate / vehiclesOfType.length : 0;
        
        types.push({
          type,
          count,
          avgDailyRate: avgRate
        });
      });
    }
    return types;
  }, [report, vehicles]);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform data for compatibility
        const processedVehicles = (data || []).map(vehicle => ({
          ...vehicle,
          currentCustomer: vehicle.current_customer || undefined, // Add for FleetReport.tsx
          dailyRate: vehicle.rent_amount || 0 // Add for FleetReport.tsx
        }));

        setVehicles(processedVehicles);
        generateReport(processedVehicles);
      } catch (err) {
        console.error('Error fetching vehicles for report:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch vehicles'));
        toast.error('Failed to load fleet data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  const generateReport = (vehicleData: Vehicle[]) => {
    if (!Array.isArray(vehicleData) || vehicleData.length === 0) {
      return;
    }

    const totalVehicles = vehicleData.length;
    const availableVehicles = vehicleData.filter(v => v.status === 'available').length;
    const rentedVehicles = vehicleData.filter(v => v.status === 'rented').length;
    const maintenanceVehicles = vehicleData.filter(v => v.status === 'maintenance').length;

    const vehiclesByType: Record<string, number> = {};
    const vehiclesByStatus: Record<string, number> = {};
    const vehiclesByMake: Record<string, number> = {};

    let totalRent = 0;
    let vehiclesWithRent = 0;

    vehicleData.forEach(vehicle => {
      // Handle vehicle_type instead of type
      const vehicleType = vehicle.vehicle_type || 'unknown';
      vehiclesByType[vehicleType] = (vehiclesByType[vehicleType] || 0) + 1;

      // Handle status
      const status = vehicle.status || 'unknown';
      vehiclesByStatus[status] = (vehiclesByStatus[status] || 0) + 1;

      // Handle make
      const make = vehicle.make || 'unknown';
      vehiclesByMake[make] = (vehiclesByMake[make] || 0) + 1;

      // Calculate rent amounts
      if (vehicle.rent_amount) {
        totalRent += vehicle.rent_amount;
        vehiclesWithRent++;
      }
    });

    const averageRentAmount = vehiclesWithRent > 0 ? totalRent / vehiclesWithRent : 0;

    setReport({
      totalVehicles,
      availableVehicles,
      rentedVehicles,
      maintenanceVehicles,
      vehiclesByType,
      vehiclesByStatus,
      vehiclesByMake,
      averageRentAmount,
      totalRentAmount: totalRent,
      activeRentals: rentedVehicles, // Added for FleetReport.tsx
      maintenanceRequired: maintenanceVehicles, // Added for FleetReport.tsx
      averageDailyRate: averageRentAmount // Added for FleetReport.tsx
    });
  };

  return { 
    vehicles, 
    report, 
    isLoading, 
    error,
    // Added for FleetReport.tsx
    fleetStats: report,
    vehiclesByType
  };
};
