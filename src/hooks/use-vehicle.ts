
import { useVehicleService } from './services/useVehicleService';
import { useQuery } from '@tanstack/react-query';
import type { VehicleFilterParams } from '@/services/VehicleService';
import { useState } from 'react';

export function useVehicle(vehicleId?: string) {
  const {
    vehicles,
    isLoading,
    error,
    filters,
    setFilters,
    vehicleTypes,
    availableVehicles,
    getVehicleDetails,
    updateVehicle,
    updateStatus,
    deleteVehicle,
    calculateUtilization,
  } = useVehicleService();

  const [searchParams, setSearchParams] = useState<VehicleFilterParams>({});

  const { data: vehicleDetails } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: () => getVehicleDetails(vehicleId!),
    enabled: !!vehicleId,
  });

  const handleFilterChange = (newFilters: VehicleFilterParams) => {
    setSearchParams(prev => ({ ...prev, ...newFilters }));
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    vehicles,
    isLoading,
    error,
    filters: searchParams,
    handleFilterChange,
    vehicleTypes,
    availableVehicles,
    vehicleDetails,
    updateVehicle,
    updateStatus,
    deleteVehicle,
    calculateUtilization,
  };
}
