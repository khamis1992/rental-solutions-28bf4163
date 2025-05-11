
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Define the shape of report data
export type ReportData = {
  vehicles: any[];
  report: {
    totalVehicles: number;
    rentedVehicles: number;
    maintenanceVehicles: number;
    averageRentAmount: number;
    vehiclesByType: Record<string, number>;
  };
};

export function useFleetReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Function to generate report data
  const generateReportData = async (): Promise<ReportData> => {
    setLoading(true);
    setError('');
    
    try {
      // Get all vehicles
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select(`
          *,
          leases(
            id,
            customer_id,
            status,
            start_date,
            end_date
          ),
          maintenance(
            id,
            status,
            scheduled_date
          )
        `);

      if (vehiclesError) throw new Error(vehiclesError.message);
      
      // Get customers for active leases
      const vehiclesWithData = await Promise.all(
        (vehicles || []).map(async (vehicle) => {
          // Find active lease for this vehicle
          const activeLease = vehicle.leases?.find((lease: any) => 
            lease.status === 'active'
          );
          
          if (activeLease?.customer_id) {
            // Get customer data
            const { data: customer } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', activeLease.customer_id)
              .single();
              
            return {
              ...vehicle,
              currentCustomer: customer?.full_name || null
            };
          }
          
          return vehicle;
        })
      );

      // Calculate report stats
      const totalVehicles = vehiclesWithData.length;
      const rentedVehicles = vehiclesWithData.filter(v => v.status === 'rented').length;
      const maintenanceVehicles = vehiclesWithData.filter(
        v => v.status === 'maintenance' || v.status === 'repair'
      ).length;
      
      // Calculate average rent amount
      let totalRent = 0;
      let vehiclesWithRent = 0;
      
      vehiclesWithData.forEach(vehicle => {
        if (vehicle && vehicle.rent_amount) {
          totalRent += vehicle.rent_amount;
          vehiclesWithRent++;
        }
      });
      
      const averageRentAmount = vehiclesWithRent > 0 
        ? totalRent / vehiclesWithRent 
        : 0;
        
      // Calculate vehicles by type
      const vehiclesByType: Record<string, number> = {};
      
      vehiclesWithData.forEach(vehicle => {
        if (vehicle && vehicle.vehicle_type) {
          if (!vehiclesByType[vehicle.vehicle_type]) {
            vehiclesByType[vehicle.vehicle_type] = 0;
          }
          vehiclesByType[vehicle.vehicle_type]++;
        }
      });

      return {
        vehicles: vehiclesWithData,
        report: {
          totalVehicles,
          rentedVehicles,
          maintenanceVehicles,
          averageRentAmount,
          vehiclesByType
        }
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate report';
      setError(errorMessage);
      return {
        vehicles: [],
        report: {
          totalVehicles: 0,
          rentedVehicles: 0,
          maintenanceVehicles: 0,
          averageRentAmount: 0,
          vehiclesByType: {}
        }
      };
    } finally {
      setLoading(false);
    }
  };

  // Generate a report for a specific vehicle
  const generateVehicleReport = async (vehicleId: string) => {
    // Implementation for vehicle-specific report
    console.log(`Generating report for vehicle ${vehicleId}`);
    // This would be implemented based on requirements
  };

  // Export report to different formats
  const exportReport = (format: 'pdf' | 'excel') => {
    console.log(`Exporting report as ${format}`);
    // This would be implemented based on requirements
  };

  // React Query hook for report data
  const { data: reportData, refetch } = useQuery({
    queryKey: ['fleetReport'],
    queryFn: generateReportData,
    refetchOnWindowFocus: false,
  });

  return { 
    reportData: reportData || { 
      vehicles: [], 
      report: {
        totalVehicles: 0,
        rentedVehicles: 0,
        maintenanceVehicles: 0,
        averageRentAmount: 0,
        vehiclesByType: {}
      }
    },
    loading, 
    error,
    generateReport: generateVehicleReport,
    exportReport
  };
}
