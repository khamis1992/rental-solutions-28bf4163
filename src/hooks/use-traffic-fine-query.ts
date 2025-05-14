/**
 * Traffic Fines Hooks
 * 
 * Provides React Query hooks for traffic fines data management with proper caching,
 * loading states, and error handling.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  TrafficFine,
  TrafficFineInsert,
  TrafficFineUpdate,
  TrafficFineStatus,
  ViolationType,
  TrafficFineValidation
} from '@/types/traffic-fine.types';
import { trafficFineService } from '@/services/StandardizedTrafficFineService';
import { toast } from 'sonner';
import { useState } from 'react';
import { getConnectionStatus } from '@/utils/database-connection';

// Query keys
const trafficFineKeys = {
  all: ['trafficFines'] as const,
  lists: () => [...trafficFineKeys.all, 'list'] as const,
  list: (filters: any) => [...trafficFineKeys.lists(), filters] as const,
  details: () => [...trafficFineKeys.all, 'detail'] as const,
  detail: (id: string) => [...trafficFineKeys.details(), id] as const,
  statistics: () => [...trafficFineKeys.all, 'statistics'] as const,
  vehicle: (vehicleId: string) => 
    [...trafficFineKeys.all, 'vehicle', vehicleId] as const,
  customer: (customerId: string) => 
    [...trafficFineKeys.all, 'customer', customerId] as const,
  validations: (batchId: string) => 
    [...trafficFineKeys.all, 'validations', batchId] as const,
};

/**
 * Hook for traffic fines operations with React Query integration
 */
export function useTrafficFineQuery() {
  const queryClient = useQueryClient();
  const [connectionStatus] = useState(getConnectionStatus());
  
  /**
   * Get traffic fines with filtering and pagination
   */
  const getTrafficFines = (
    filters: {
      vehicleId?: string;
      agreementId?: string;
      customerId?: string;
      status?: TrafficFineStatus | TrafficFineStatus[];
      violationType?: ViolationType;
      licensePlate?: string;
      fromDate?: Date;
      toDate?: Date;
      searchTerm?: string;
    } = {},
    limit = 10,
    offset = 0
  ) => {
    return useQuery({
      queryKey: trafficFineKeys.list({ ...filters, limit, offset }),
      queryFn: () => trafficFineService.getTrafficFines(filters, limit, offset),
      enabled: connectionStatus !== 'disconnected',
      staleTime: 5 * 60 * 1000, // 5 minutes
      keepPreviousData: true,
    });
  };
  
  /**
   * Get a single traffic fine by ID
   */
  const getTrafficFineById = (id: string) => {
    return useQuery({
      queryKey: trafficFineKeys.detail(id),
      queryFn: () => trafficFineService.getTrafficFineById(id),
      enabled: !!id && connectionStatus !== 'disconnected',
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
  
  /**
   * Get traffic fines for a specific vehicle
   */
  const getVehicleTrafficFines = (vehicleId: string) => {
    return useQuery({
      queryKey: trafficFineKeys.vehicle(vehicleId),
      queryFn: () => trafficFineService.getVehicleTrafficFines(vehicleId),
      enabled: !!vehicleId && connectionStatus !== 'disconnected',
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
  
  /**
   * Get traffic fines for a specific customer
   */
  const getCustomerTrafficFines = (customerId: string) => {
    return useQuery({
      queryKey: trafficFineKeys.customer(customerId),
      queryFn: () => trafficFineService.getCustomerTrafficFines(customerId),
      enabled: !!customerId && connectionStatus !== 'disconnected',
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
  
  /**
   * Get traffic fine statistics
   */
  const getTrafficFineStatistics = () => {
    return useQuery({
      queryKey: trafficFineKeys.statistics(),
      queryFn: () => trafficFineService.getTrafficFineStatistics(),
      enabled: connectionStatus !== 'disconnected',
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };
  
  /**
   * Get validation results
   */
  const getValidationResults = (batchId: string) => {
    return useQuery({
      queryKey: trafficFineKeys.validations(batchId),
      queryFn: () => trafficFineService.getValidationResults(batchId),
      enabled: !!batchId && connectionStatus !== 'disconnected'
    });
  };
  
  /**
   * Create a new traffic fine
   */
  const createTrafficFine = () => {
    return useMutation({
      mutationFn: (data: TrafficFineInsert) => 
        trafficFineService.createTrafficFine(data),
      onSuccess: (result) => {
        if (result) {
          queryClient.invalidateQueries({ queryKey: trafficFineKeys.lists() });
          
          if (result.vehicle_id) {
            queryClient.invalidateQueries({ 
              queryKey: trafficFineKeys.vehicle(result.vehicle_id) 
            });
          }
          
          if (result.customer_id) {
            queryClient.invalidateQueries({ 
              queryKey: trafficFineKeys.customer(result.customer_id) 
            });
          }
          
          queryClient.invalidateQueries({ queryKey: trafficFineKeys.statistics() });
          toast.success('Traffic fine created successfully');
        }
      }
    });
  };
  
  /**
   * Update an existing traffic fine
   */
  const updateTrafficFine = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string, data: TrafficFineUpdate }) => 
        trafficFineService.updateTrafficFine(id, data),
      onSuccess: (result) => {
        if (result) {
          queryClient.invalidateQueries({ queryKey: trafficFineKeys.detail(result.id) });
          
          if (result.vehicle_id) {
            queryClient.invalidateQueries({ 
              queryKey: trafficFineKeys.vehicle(result.vehicle_id) 
            });
          }
          
          if (result.customer_id) {
            queryClient.invalidateQueries({ 
              queryKey: trafficFineKeys.customer(result.customer_id) 
            });
          }
          
          queryClient.invalidateQueries({ queryKey: trafficFineKeys.lists() });
          queryClient.invalidateQueries({ queryKey: trafficFineKeys.statistics() });
          toast.success('Traffic fine updated successfully');
        }
      }
    });
  };
  
  /**
   * Delete a traffic fine
   */
  const deleteTrafficFine = () => {
    return useMutation({
      mutationFn: (id: string) => trafficFineService.deleteTrafficFine(id),
      onSuccess: (result) => {
        if (result) {
          if (result.vehicle_id) {
            queryClient.invalidateQueries({ 
              queryKey: trafficFineKeys.vehicle(result.vehicle_id) 
            });
          }
          
          if (result.customer_id) {
            queryClient.invalidateQueries({ 
              queryKey: trafficFineKeys.customer(result.customer_id) 
            });
          }
          
          queryClient.invalidateQueries({ queryKey: trafficFineKeys.lists() });
          queryClient.invalidateQueries({ queryKey: trafficFineKeys.statistics() });
          toast.success('Traffic fine deleted successfully');
        }
      }
    });
  };

  /**
   * Update traffic fine status
   */
  const updateTrafficFineStatus = () => {
    return useMutation({
      mutationFn: ({ 
        id, 
        status, 
        paymentDetails 
      }: { 
        id: string, 
        status: TrafficFineStatus,
        paymentDetails?: {
          paymentDate: Date;
          paymentReference?: string;
          paymentReceiptUrl?: string;
        }
      }) => trafficFineService.updateTrafficFineStatus(id, status, paymentDetails),
      onSuccess: (result) => {
        if (result) {
          queryClient.invalidateQueries({ queryKey: trafficFineKeys.detail(result.id) });
          
          if (result.vehicle_id) {
            queryClient.invalidateQueries({ 
              queryKey: trafficFineKeys.vehicle(result.vehicle_id) 
            });
          }
          
          if (result.customer_id) {
            queryClient.invalidateQueries({ 
              queryKey: trafficFineKeys.customer(result.customer_id) 
            });
          }
          
          queryClient.invalidateQueries({ queryKey: trafficFineKeys.lists() });
          queryClient.invalidateQueries({ queryKey: trafficFineKeys.statistics() });
          toast.success(`Traffic fine status updated to ${result.status}`);
        }
      }
    });
  };

  /**
   * Validate traffic fines for a license plate
   */
  const validateTrafficFines = () => {
    return useMutation({
      mutationFn: ({ 
        licensePlate, 
        batchId 
      }: { 
        licensePlate: string,
        batchId?: string
      }) => trafficFineService.validateTrafficFines(licensePlate, batchId),
      onSuccess: (result) => {
        if (result) {
          if (result.batch_id) {
            queryClient.invalidateQueries({ 
              queryKey: trafficFineKeys.validations(result.batch_id) 
            });
          }
          
          toast.success(`Traffic fine validation completed for ${result.license_plate}`);
        }
      }
    });
  };

  /**
   * Bulk validate traffic fines
   */
  const bulkValidateTrafficFines = () => {
    return useMutation({
      mutationFn: ({ 
        licensePlates 
      }: { 
        licensePlates: string[]
      }) => trafficFineService.bulkValidateTrafficFines(licensePlates),
      onSuccess: (result) => {
        if (result) {
          toast.success(`Validation started for ${result.count} vehicles. Batch ID: ${result.batchId}`);
        }
      }
    });
  };
  
  return {
    getTrafficFines,
    getTrafficFineById,
    getVehicleTrafficFines,
    getCustomerTrafficFines,
    getTrafficFineStatistics,
    getValidationResults,
    createTrafficFine,
    updateTrafficFine,
    deleteTrafficFine,
    updateTrafficFineStatus,
    validateTrafficFines,
    bulkValidateTrafficFines,
    connectionStatus
  };
}
