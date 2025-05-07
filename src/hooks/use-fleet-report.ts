
// Fixing use-fleet-report.ts to handle the 'type' property issue
import { useState, useEffect } from 'react';
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
    totalRentAmount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setVehicles(data || []);
        generateReport(data || []);
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
      totalRentAmount: totalRent
    });
  };

  return { vehicles, report, isLoading, error };
};
