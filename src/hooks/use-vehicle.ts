
/**
 * Custom hook for managing vehicle operations and state
 * Provides vehicle data access, filtering, and mutation capabilities
 */
import { useVehicleService } from './services/useVehicleService';
import { useQuery } from '@tanstack/react-query';
import type { VehicleFilterParams } from '@/services/VehicleService';
import { useState } from 'react';

/**
 * Hook for vehicle management operations
 * @param vehicleId - Optional vehicle ID for detailed operations
 * @returns Object containing vehicle data and operations
 */
export function useVehicle(vehicleId?: string) {
  const vehicleServiceHook = useVehicleService();
  const [searchParams, setSearchParams] = useState<VehicleFilterParams>({});

  /**
   * Query for fetching detailed vehicle information
   */
  const { data: vehicleDetails } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: () => vehicleServiceHook.getVehicleDetails(vehicleId!),
    enabled: !!vehicleId,
  });

  /**
   * Updates vehicle search/filter parameters
   * @param newFilters - Updated filter criteria
   */
  const handleFilterChange = (newFilters: VehicleFilterParams) => {
    setSearchParams(prev => ({ ...prev, ...newFilters }));
    vehicleServiceHook.setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    vehicles: vehicleServiceHook.vehicles,
    isLoading: vehicleServiceHook.isLoading,
    error: vehicleServiceHook.error,
    filters: searchParams,
    handleFilterChange,
    vehicleTypes: vehicleServiceHook.vehicleTypes,
    availableVehicles: vehicleServiceHook.availableVehicles,
    vehicleDetails,
    updateVehicle: vehicleServiceHook.updateVehicle,
    updateStatus: vehicleServiceHook.updateStatus,
    deleteVehicle: vehicleServiceHook.deleteVehicle,
    calculateUtilization: vehicleServiceHook.calculateUtilization,
  };
}
