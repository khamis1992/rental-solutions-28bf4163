/**
 * Custom hook for managing vehicle operations and state
 * Provides vehicle data access, filtering, and mutation capabilities
 */
import { useVehicleService } from './services/useVehicleService';
import { useQuery } from '@tanstack/react-query';
import type { VehicleFilterParams } from '@/types/vehicle';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Vehicle } from '@/types/vehicle';
import { hasData, getErrorMessage } from '@/utils/supabase-response-helpers';

/**
 * Hook for vehicle management operations
 * @param vehicleId - Optional vehicle ID for detailed operations
 * @returns Object containing vehicle data and operations
 */
export function useVehicle(vehicleId?: string) {
  const {
    vehicles,
    isLoading,
    error,
    filters,
    setFilters,
    vehicleTypes,
    availableVehicles,
    updateVehicle,
    updateStatus,
    deleteVehicle,
    calculateUtilization,
  } = useVehicleService();

  const [searchParams, setSearchParams] = useState<VehicleFilterParams>({});

  /**
   * Query for fetching detailed vehicle information
   */
  const { data: vehicleDetails, refetch } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: () => getVehicleById(vehicleId!),
    enabled: !!vehicleId,
  });

  /**
   * Get vehicle details by id
   */
  const getVehicleById = async (id: string): Promise<Vehicle> => {
    const response = await supabase
      .from('vehicles')
      .select('*, vehicle_types(*)')
      .eq('id', id)
      .single();

    if (!hasData(response)) {
      throw new Error(`Vehicle not found: ${getErrorMessage(response)}`);
    }

    // Map database vehicle record to application vehicle type
    const vehicle: Vehicle = {
      id: response.data.id,
      make: response.data.make,
      model: response.data.model,
      year: response.data.year,
      license_plate: response.data.license_plate,
      vin: response.data.vin,
      color: response.data.color,
      mileage: response.data.mileage,
      image_url: response.data.image_url,
      status: response.data.status,
      description: response.data.description,
      location: response.data.location,
      created_at: response.data.created_at,
      updated_at: response.data.updated_at,
      rent_amount: response.data.rent_amount,
      vehicle_type_id: response.data.vehicle_type_id,
      insurance_company: response.data.insurance_company,
      insurance_expiry: response.data.insurance_expiry,
      notes: response.data.notes,
      additional_images: response.data.additional_images,
      dailyRate: response.data.daily_rate || (response.data.vehicle_types?.daily_rate || null),
      monthlyRate: response.data.monthly_rate || null
    };

    // Add vehicle type info if available
    if (response.data.vehicle_types) {
      vehicle.vehicle_type = {
        id: response.data.vehicle_types.id,
        name: response.data.vehicle_types.name,
        daily_rate: response.data.vehicle_types.daily_rate,
        description: response.data.vehicle_types.description
      };
      
      vehicle.vehicleType = vehicle.vehicle_type;
    }

    return vehicle;
  };

  /**
   * Updates vehicle search/filter parameters
   * @param newFilters - Updated filter criteria
   */
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
    getVehicleById,
    refetch
  };
}
