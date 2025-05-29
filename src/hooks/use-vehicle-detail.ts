
import { useEffect, useState, useCallback } from 'react';
import { useVehicleService } from './services/useVehicleService';
import { Vehicle, VehicleStatus } from '@/types/vehicle';
import { useQuery } from '@tanstack/react-query';

export const useVehicleDetail = (vehicleId: string | undefined) => {
  const vehicleService = useVehicleService();
  const [error, setError] = useState<Error | null>(null);
  
  // Use React Query for data fetching with proper caching
  const {
    data: vehicle,
    isLoading,
    refetch,
    error: queryError
  } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: async () => {
      if (!vehicleId) {
        throw new Error('Vehicle ID is required');
      }
      
      try {
        console.log(`useVehicleDetail: Fetching vehicle details for ID ${vehicleId}`);
        const vehicleData = await vehicleService.getVehicleDetails(vehicleId);
        
        if (!vehicleData) {
          throw new Error(`No data returned for vehicle ID ${vehicleId}`);
        }
        
        // Helper function to safely cast status
        const safeMapStatus = (status: any): VehicleStatus => {
          const validStatuses: VehicleStatus[] = ['available', 'rented', 'maintenance', 'retired', 'police_station', 'accident', 'stolen', 'reserved'];
          if (typeof status === 'string' && validStatuses.includes(status as VehicleStatus)) {
            return status as VehicleStatus;
          }
          return 'available'; // default fallback
        };
        
        // Map the vehicle data to ensure it has all required Vehicle properties
        const mappedVehicle: Vehicle = {
          id: vehicleData.id,
          license_plate: vehicleData.license_plate,
          make: vehicleData.make,
          model: vehicleData.model,
          year: vehicleData.year,
          color: vehicleData.color || '',
          vin: vehicleData.engine_number || (vehicleData as any).vin || 'N/A', // Use engine_number for vin if available
          mileage: (vehicleData as any).mileage || 0, // Default to 0 if not available
          status: safeMapStatus((vehicleData as any).status || 'available'),
          rent_amount: (vehicleData as any).rent_amount || 0, // Default to 0 if not available
          insurance_company: (vehicleData as any).insurance_company || '',
          insurance_expiry: (vehicleData as any).insurance_expiry || null,
          location: (vehicleData as any).location || '',
          image_url: (vehicleData as any).image_url || null,
          created_at: vehicleData.created_at,
          updated_at: vehicleData.updated_at,
          description: vehicleData.notes || (vehicleData as any).attention_needed_notes || '',
          // Add any additional mapped properties from vehicleData
          ...vehicleData
        };
        
        return mappedVehicle;
      } catch (err) {
        console.error('useVehicleDetail: Error fetching vehicle:', err);
        throw err;
      }
    },
    staleTime: 60000, // Data remains fresh for 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
    retry: 1, // Only retry once on failure
    enabled: !!vehicleId // Only run query if vehicleId is provided
  });

  // Handle and expose any errors from the query
  useEffect(() => {
    if (queryError) {
      setError(queryError instanceof Error ? queryError : new Error('Failed to fetch vehicle'));
    } else {
      setError(null);
    }
  }, [queryError]);

  return {
    vehicle,
    isLoading,
    error: error || queryError,
    refetch
  };
};
