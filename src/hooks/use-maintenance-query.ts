/**
 * Maintenance Hooks
 * 
 * Provides React Query hooks for vehicle maintenance data management with proper caching,
 * loading states, and error handling.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Maintenance,
  MaintenanceInsert,
  MaintenanceUpdate,
  MaintenanceStatus,
  MaintenanceType,
  MaintenancePriority
} from '@/types/maintenance.types';
import { maintenanceService } from '@/services/StandardizedMaintenanceService';
import { toast } from 'sonner';
import { useState } from 'react';
import { getConnectionStatus } from '@/utils/database-connection';

// Query keys
const maintenanceKeys = {
  all: ['maintenance'] as const,
  lists: () => [...maintenanceKeys.all, 'list'] as const,
  list: (filters: any) => [...maintenanceKeys.lists(), filters] as const,
  details: () => [...maintenanceKeys.all, 'detail'] as const,
  detail: (id: string) => [...maintenanceKeys.details(), id] as const,
  statistics: (vehicleId?: string) => [...maintenanceKeys.all, 'statistics', vehicleId || 'all'] as const,
  vehicle: (vehicleId: string) => 
    [...maintenanceKeys.all, 'vehicle', vehicleId] as const,
};

/**
 * Hook for maintenance operations with React Query integration
 */
export function useMaintenanceQuery() {
  const queryClient = useQueryClient();
  const [connectionStatus] = useState(getConnectionStatus());
  
  /**
   * Get maintenance records with filtering and pagination
   */
  const getMaintenance = (
    filters: {
      vehicleId?: string;
      status?: MaintenanceStatus | MaintenanceStatus[];
      type?: MaintenanceType;
      priority?: MaintenancePriority;
      categoryId?: string;
      fromDate?: Date;
      toDate?: Date;
      searchTerm?: string;
    } = {},
    limit = 10,
    offset = 0
  ) => {
    return useQuery({
      queryKey: maintenanceKeys.list({ ...filters, limit, offset }),
      queryFn: () => maintenanceService.getMaintenance(filters, limit, offset),
      enabled: connectionStatus !== 'disconnected',
      staleTime: 5 * 60 * 1000, // 5 minutes
      keepPreviousData: true,
    });
  };
  
  /**
   * Get a single maintenance record by ID
   */
  const getMaintenanceById = (id: string) => {
    return useQuery({
      queryKey: maintenanceKeys.detail(id),
      queryFn: () => maintenanceService.getMaintenanceById(id),
      enabled: !!id && connectionStatus !== 'disconnected',
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
  
  /**
   * Get maintenance for a specific vehicle
   */
  const getVehicleMaintenance = (vehicleId: string) => {
    return useQuery({
      queryKey: maintenanceKeys.vehicle(vehicleId),
      queryFn: () => maintenanceService.getVehicleMaintenance(vehicleId),
      enabled: !!vehicleId && connectionStatus !== 'disconnected',
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
  
  /**
   * Get maintenance statistics
   */
  const getMaintenanceStatistics = (vehicleId?: string) => {
    return useQuery({
      queryKey: maintenanceKeys.statistics(vehicleId),
      queryFn: () => maintenanceService.getMaintenanceStatistics(vehicleId),
      enabled: connectionStatus !== 'disconnected',
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };
  
  /**
   * Create a new maintenance record
   */
  const createMaintenance = () => {
    return useMutation({
      mutationFn: (data: MaintenanceInsert) => 
        maintenanceService.createMaintenance(data),
      onSuccess: (result) => {
        if (result) {
          queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() });
          
          if (result.vehicle_id) {
            queryClient.invalidateQueries({ 
              queryKey: maintenanceKeys.vehicle(result.vehicle_id) 
            });
          }
          
          queryClient.invalidateQueries({ queryKey: maintenanceKeys.statistics() });
          toast.success('Maintenance record created successfully');
        }
      }
    });
  };
  
  /**
   * Update an existing maintenance record
   */
  const updateMaintenance = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string, data: MaintenanceUpdate }) => 
        maintenanceService.updateMaintenance(id, data),
      onSuccess: (result) => {
        if (result) {
          queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(result.id) });
          
          if (result.vehicle_id) {
            queryClient.invalidateQueries({ 
              queryKey: maintenanceKeys.vehicle(result.vehicle_id) 
            });
          }
          
          queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() });
          queryClient.invalidateQueries({ queryKey: maintenanceKeys.statistics() });
          toast.success('Maintenance record updated successfully');
        }
      }
    });
  };
  
  /**
   * Delete a maintenance record
   */
  const deleteMaintenance = () => {
    return useMutation({
      mutationFn: (id: string) => maintenanceService.deleteMaintenance(id),
      onSuccess: (result) => {
        if (result) {
          if (result.vehicle_id) {
            queryClient.invalidateQueries({ 
              queryKey: maintenanceKeys.vehicle(result.vehicle_id) 
            });
          }
          
          queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() });
          queryClient.invalidateQueries({ queryKey: maintenanceKeys.statistics() });
          toast.success('Maintenance record deleted successfully');
        }
      }
    });
  };

  /**
   * Update maintenance status
   */
  const updateMaintenanceStatus = () => {
    return useMutation({
      mutationFn: ({ id, status }: { id: string, status: MaintenanceStatus }) => 
        maintenanceService.updateMaintenanceStatus(id, status),
      onSuccess: (result) => {
        if (result) {
          queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(result.id) });
          
          if (result.vehicle_id) {
            queryClient.invalidateQueries({ 
              queryKey: maintenanceKeys.vehicle(result.vehicle_id) 
            });
          }
          
          queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() });
          toast.success(`Maintenance status updated to ${result.status}`);
        }
      }
    });
  };

  /**
   * Schedule routine maintenance
   */
  const scheduleRoutineMaintenance = () => {
    return useMutation({
      mutationFn: ({ 
        vehicleId, 
        scheduledDate, 
        maintenanceType = MaintenanceType.ROUTINE 
      }: { 
        vehicleId: string, 
        scheduledDate: Date, 
        maintenanceType?: MaintenanceType 
      }) => maintenanceService.scheduleRoutineMaintenance(
        vehicleId, 
        scheduledDate, 
        maintenanceType
      ),
      onSuccess: (result) => {
        if (result) {
          queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() });
          
          if (result.vehicle_id) {
            queryClient.invalidateQueries({ 
              queryKey: maintenanceKeys.vehicle(result.vehicle_id) 
            });
          }
          
          toast.success('Routine maintenance scheduled successfully');
        }
      }
    });
  };
  
  return {
    getMaintenance,
    getMaintenanceById,
    getVehicleMaintenance,
    getMaintenanceStatistics,
    createMaintenance,
    updateMaintenance,
    deleteMaintenance,
    updateMaintenanceStatus,
    scheduleRoutineMaintenance,
    connectionStatus
  };
}
