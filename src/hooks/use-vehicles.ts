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
    queryFn: () => getVehicleDetails(vehicleId!),
    enabled: !!vehicleId,
  });

  /**
   * Get vehicle details by id
   */
  const getVehicleDetails = async (id: string): Promise<Vehicle> => {
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
      vehicle.vehicleType = {
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
    getVehicleDetails,
    refetch
  };
}

/**
 * Hook for vehicle operations across the application
 * Provides access to vehicle data and operations
 */
export function useVehicles() {
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
    getVehicleDetails
  } = useVehicleService();

  const [searchParams, setSearchParams] = useState<VehicleFilterParams>({});

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
      vehicle.vehicleType = {
        id: response.data.vehicle_types.id,
        name: response.data.vehicle_types.name,
        daily_rate: response.data.vehicle_types.daily_rate,
        description: response.data.vehicle_types.description
      };
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

  // Hook to fetch a list of vehicles with optional filtering
  const useList = (filterParams: VehicleFilterParams = {}) => {
    return useQuery({
      queryKey: ['vehicles', filterParams],
      queryFn: async () => {
        try {
          const result = await getVehicles(filterParams);
          return result;
        } catch (error) {
          console.error("Error fetching vehicles:", error);
          throw error;
        }
      }
    });
  };

  // Function to get vehicles with filtering
  const getVehicles = async (filterParams: VehicleFilterParams = {}) => {
    let query = supabase.from('vehicles').select('*, vehicle_types(*)');
    
    if (filterParams.status) {
      query = query.eq('status', filterParams.status);
    }
    
    if (filterParams.make) {
      query = query.eq('make', filterParams.make);
    }
    
    if (filterParams.model) {
      query = query.eq('model', filterParams.model);
    }
    
    if (filterParams.year) {
      query = query.eq('year', filterParams.year);
    }
    
    if (filterParams.location) {
      query = query.eq('location', filterParams.location);
    }

    if (filterParams.vehicle_type_id) {
      query = query.eq('vehicle_type_id', filterParams.vehicle_type_id);
    }
    
    if (filterParams.search) {
      query = query.or(`vin.ilike.%${filterParams.search}%,license_plate.ilike.%${filterParams.search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) throw new Error(error.message);
    
    return data || [];
  };

  // Hook for watching real-time vehicle updates
  const useRealtimeUpdates = () => {
    // Implementation left simple for now
    console.log("Real-time updates initiated");
    return null;
  };

  return {
    vehicles,
    isLoading,
    error,
    filters: searchParams,
    handleFilterChange,
    vehicleTypes,
    availableVehicles,
    updateVehicle,
    updateStatus,
    deleteVehicle,
    calculateUtilization,
    getVehicleById,
    useList,
    useRealtimeUpdates
  };
}
