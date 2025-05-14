/**
 * Agreement Hooks
 * 
 * Provides React Query hooks for agreement data management with proper caching,
 * loading states, and error handling.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Agreement, AgreementDetail, TableFilters } from '@/types/agreement';
import { agreementService } from '@/services/AgreementService';
import { toast } from 'sonner';
import { useState } from 'react';
import { getConnectionStatus } from '@/utils/database-connection';

// Query keys
const agreementKeys = {
  all: ['agreements'] as const,
  lists: () => [...agreementKeys.all, 'list'] as const,
  list: (filters: TableFilters) => [...agreementKeys.lists(), filters] as const,
  details: () => [...agreementKeys.all, 'detail'] as const,
  detail: (id: string) => [...agreementKeys.details(), id] as const,
  expiring: () => [...agreementKeys.all, 'expiring'] as const,
};

/**
 * Hook for agreement operations with React Query integration
 */
export function useAgreementQuery() {
  const queryClient = useQueryClient();
  const [connectionStatus] = useState(getConnectionStatus());
  
  /**
   * Get agreements with filtering and pagination
   */
  const getAgreements = (filters: TableFilters = {}, limit = 10, offset = 0) => {
    return useQuery({
      queryKey: agreementKeys.list(filters),
      queryFn: () => agreementService.getAgreements(filters, limit, offset),
      enabled: connectionStatus !== 'disconnected',
      staleTime: 5 * 60 * 1000, // 5 minutes
      keepPreviousData: true,
    });
  };
  
  /**
   * Get a single agreement by ID
   */
  const getAgreementById = (id: string) => {
    return useQuery({
      queryKey: agreementKeys.detail(id),
      queryFn: () => agreementService.getAgreementById(id),
      enabled: !!id && connectionStatus !== 'disconnected',
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
  
  /**
   * Get agreements expiring soon
   */
  const getExpiringAgreements = (daysThreshold = 7) => {
    return useQuery({
      queryKey: [...agreementKeys.expiring(), daysThreshold],
      queryFn: () => agreementService.getExpiringAgreements(daysThreshold),
      enabled: connectionStatus !== 'disconnected',
      staleTime: 30 * 60 * 1000, // 30 minutes
    });
  };
  
  /**
   * Create a new agreement
   */
  const createAgreement = () => {
    return useMutation({
      mutationFn: (data: Partial<Agreement>) => 
        agreementService.createAgreement(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: agreementKeys.lists() });
        toast.success('Agreement created successfully');
      }
    });
  };
  
  /**
   * Update an existing agreement
   */
  const updateAgreement = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string, data: Partial<Agreement> }) => 
        agreementService.updateAgreement(id, data),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: agreementKeys.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: agreementKeys.lists() });
        toast.success('Agreement updated successfully');
      }
    });
  };
  
  /**
   * Delete an agreement
   */
  const deleteAgreement = () => {
    return useMutation({
      mutationFn: (id: string) => agreementService.deleteAgreement(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: agreementKeys.lists() });
        toast.success('Agreement deleted successfully');
      }
    });
  };
  
  /**
   * Update agreement status
   */
  const updateAgreementStatus = () => {
    return useMutation({
      mutationFn: ({ id, status }: { id: string, status: string }) => 
        agreementService.updateAgreementStatus(id, status),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: agreementKeys.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: agreementKeys.lists() });
        toast.success(`Agreement status updated to ${variables.status}`);
      }
    });
  };
  
  return {
    getAgreements,
    getAgreementById,
    getExpiringAgreements,
    createAgreement,
    updateAgreement,
    deleteAgreement,
    updateAgreementStatus,
    connectionStatus
  };
}
