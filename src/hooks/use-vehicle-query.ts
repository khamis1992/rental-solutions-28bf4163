/**
 * Vehicle Hooks
 * 
 * Provides React Query hooks for vehicle data management with proper caching,
 * loading states, and error handling.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Vehicle, VehicleFilterParams, VehicleFormData } from '@/types/vehicle';
import { VehicleService, PaginatedVehicleResult } from '@/services/VehicleService';
import { toast } from 'sonner';
import { useState, useCallback } from 'react';
import { getConnectionStatus } from '@/utils/database-connection';

// Vehicle service instance
const vehicleService = new VehicleService();

// Query keys
const vehicleKeys = {
  all: ['vehicles'] as const,
  lists: () => [...vehicleKeys.all, 'list'] as const,
  list: (filters: VehicleFilterParams) => [...vehicleKeys.lists(), filters] as const,
  details: () => [...vehicleKeys.all, 'detail'] as const,
  detail: (id: string) => [...vehicleKeys.details(), id] as const,
  types: ['vehicleTypes'] as const
};

/**
 * Hook for vehicle operations with React Query integration
 */
export function useVehicleQuery() {
  const queryClient = useQueryClient();
  const [connectionStatus] = useState(getConnectionStatus());
  
  /**
   * Get vehicles with filtering and pagination
   */
  const getVehicles = (filters: VehicleFilterParams = {}) => {
    return useQuery({
      queryKey: vehicleKeys.list(filters),
      queryFn: () => vehicleService.getVehicles(filters),
      enabled: connectionStatus !== 'disconnected',
      staleTime: 5 * 60 * 1000, // 5 minutes
      keepPreviousData: true,
    });
  };
  
  /**
   * Get a single vehicle by ID
   */
  const getVehicleById = (id: string) => {
    return useQuery({
      queryKey: vehicleKeys.detail(id),
      queryFn: () => vehicleService.getVehicleById(id),
      enabled: !!id && connectionStatus !== 'disconnected',
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
  
  /**
   * Get all vehicle types
   */
  const getVehicleTypes = () => {
    return useQuery({
      queryKey: vehicleKeys.types,
      queryFn: () => vehicleService.getVehicleTypes(),
      staleTime: 30 * 60 * 1000, // 30 minutes
    });
  };
  
  /**
   * Create a new vehicle
   */
  const createVehicle = () => {
    return useMutation({
      mutationFn: ({ data, image }: { data: VehicleFormData, image?: File }) => 
        vehicleService.createVehicle(data, image),
      onSuccess: () => {
        // Invalidate vehicle lists to trigger refetch
        queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
        toast.success('Vehicle created successfully');
      }
    });
  };
  
  /**
   * Update an existing vehicle
   */
  const updateVehicle = () => {
    return useMutation({
      mutationFn: ({ id, data, image }: { id: string, data: VehicleFormData, image?: File }) => 
        vehicleService.updateVehicle(id, data, image),
      onSuccess: (_, variables) => {
        // Invalidate specific vehicle and lists
        queryClient.invalidateQueries({ queryKey: vehicleKeys.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
        toast.success('Vehicle updated successfully');
      }
    });
  };
  
  /**
   * Delete a vehicle
   */
  const deleteVehicle = () => {
    return useMutation({
      mutationFn: (id: string) => vehicleService.deleteVehicle(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
        toast.success('Vehicle deleted successfully');
      }
    });
  };
  
  /**
   * Update vehicle status
   */
  const updateVehicleStatus = () => {
    return useMutation({
      mutationFn: ({ id, status }: { id: string, status: string }) => 
        vehicleService.updateVehicleStatus(id, status),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: vehicleKeys.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
        toast.success(`Vehicle status updated to ${variables.status}`);
      }
    });
  };
  
  return {
    getVehicles,
    getVehicleById,
    getVehicleTypes,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    updateVehicleStatus,
    connectionStatus
  };
}
