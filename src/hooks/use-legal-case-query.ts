/**
 * Legal Case Hooks
 * 
 * Provides React Query hooks for legal case data management with proper caching,
 * loading states, and error handling.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  LegalCase, 
  LegalCaseStatus, 
  LegalCaseType,
  CasePriority 
} from '@/types/legal-case.types';
import { legalCaseService } from '@/services/StandardizedLegalCaseService';
import { toast } from 'sonner';
import { useState } from 'react';
import { getConnectionStatus } from '@/utils/database-connection';

// Query keys
const legalCaseKeys = {
  all: ['legalCases'] as const,
  lists: () => [...legalCaseKeys.all, 'list'] as const,
  list: (filters: any) => [...legalCaseKeys.lists(), filters] as const,
  details: () => [...legalCaseKeys.all, 'detail'] as const,
  detail: (id: string) => [...legalCaseKeys.details(), id] as const,
  statistics: () => [...legalCaseKeys.all, 'statistics'] as const,
  customer: (customerId: string) => 
    [...legalCaseKeys.all, 'customer', customerId] as const,
  agreement: (agreementId: string) => 
    [...legalCaseKeys.all, 'agreement', agreementId] as const,
};

/**
 * Hook for legal case operations with React Query integration
 */
export function useLegalCaseQuery() {
  const queryClient = useQueryClient();
  const [connectionStatus] = useState(getConnectionStatus());
  
  /**
   * Get legal cases with filtering and pagination
   */
  const getLegalCases = (
    filters: {
      customerId?: string;
      agreementId?: string;
      vehicleId?: string;
      status?: LegalCaseStatus | LegalCaseStatus[];
      type?: LegalCaseType | LegalCaseType[];
      priority?: CasePriority;
      fromDate?: Date;
      toDate?: Date;
      searchTerm?: string;
    } = {},
    limit = 10,
    offset = 0
  ) => {
    return useQuery({
      queryKey: legalCaseKeys.list({ ...filters, limit, offset }),
      queryFn: () => legalCaseService.getLegalCases(filters, limit, offset),
      enabled: connectionStatus !== 'disconnected',
      staleTime: 5 * 60 * 1000, // 5 minutes
      keepPreviousData: true,
    });
  };
  
  /**
   * Get a single legal case by ID
   */
  const getLegalCaseById = (id: string) => {
    return useQuery({
      queryKey: legalCaseKeys.detail(id),
      queryFn: () => legalCaseService.getLegalCaseById(id),
      enabled: !!id && connectionStatus !== 'disconnected',
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
  
  /**
   * Get legal cases for a specific customer
   */
  const getCustomerLegalCases = (customerId: string) => {
    return useQuery({
      queryKey: legalCaseKeys.customer(customerId),
      queryFn: () => legalCaseService.getCustomerLegalCases(customerId),
      enabled: !!customerId && connectionStatus !== 'disconnected',
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
  
  /**
   * Get legal cases for a specific agreement
   */
  const getAgreementLegalCases = (agreementId: string) => {
    return useQuery({
      queryKey: legalCaseKeys.agreement(agreementId),
      queryFn: () => legalCaseService.getAgreementLegalCases(agreementId),
      enabled: !!agreementId && connectionStatus !== 'disconnected',
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
  
  /**
   * Get legal case statistics
   */
  const getLegalCaseStatistics = () => {
    return useQuery({
      queryKey: legalCaseKeys.statistics(),
      queryFn: () => legalCaseService.getLegalCaseStatistics(),
      enabled: connectionStatus !== 'disconnected',
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };
  
  /**
   * Create a new legal case
   */
  const createLegalCase = () => {
    return useMutation({
      mutationFn: (data: Omit<LegalCase, 'id' | 'created_at' | 'updated_at'>) => 
        legalCaseService.createLegalCase(data),
      onSuccess: (result) => {
        if (result) {
          queryClient.invalidateQueries({ queryKey: legalCaseKeys.lists() });
          
          if (result.customer_id) {
            queryClient.invalidateQueries({ 
              queryKey: legalCaseKeys.customer(result.customer_id) 
            });
          }
          
          if (result.agreement_id) {
            queryClient.invalidateQueries({ 
              queryKey: legalCaseKeys.agreement(result.agreement_id) 
            });
          }
          
          queryClient.invalidateQueries({ queryKey: legalCaseKeys.statistics() });
          toast.success('Legal case created successfully');
        }
      }
    });
  };
  
  /**
   * Update an existing legal case
   */
  const updateLegalCase = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string, data: Partial<LegalCase> }) => 
        legalCaseService.updateLegalCase(id, data),
      onSuccess: (result) => {
        if (result) {
          queryClient.invalidateQueries({ queryKey: legalCaseKeys.detail(result.id) });
          
          if (result.customer_id) {
            queryClient.invalidateQueries({ 
              queryKey: legalCaseKeys.customer(result.customer_id) 
            });
          }
          
          if (result.agreement_id) {
            queryClient.invalidateQueries({ 
              queryKey: legalCaseKeys.agreement(result.agreement_id) 
            });
          }
          
          queryClient.invalidateQueries({ queryKey: legalCaseKeys.lists() });
          queryClient.invalidateQueries({ queryKey: legalCaseKeys.statistics() });
          toast.success('Legal case updated successfully');
        }
      }
    });
  };
  
  /**
   * Delete a legal case
   */
  const deleteLegalCase = () => {
    return useMutation({
      mutationFn: (id: string) => legalCaseService.deleteLegalCase(id),
      onSuccess: (result) => {
        if (result) {
          if (result.customer_id) {
            queryClient.invalidateQueries({ 
              queryKey: legalCaseKeys.customer(result.customer_id) 
            });
          }
          
          if (result.agreement_id) {
            queryClient.invalidateQueries({ 
              queryKey: legalCaseKeys.agreement(result.agreement_id) 
            });
          }
          
          queryClient.invalidateQueries({ queryKey: legalCaseKeys.lists() });
          queryClient.invalidateQueries({ queryKey: legalCaseKeys.statistics() });
          toast.success('Legal case deleted successfully');
        }
      }
    });
  };
  
  return {
    getLegalCases,
    getLegalCaseById,
    getCustomerLegalCases,
    getAgreementLegalCases,
    getLegalCaseStatistics,
    createLegalCase,
    updateLegalCase,
    deleteLegalCase,
    connectionStatus
  };
}
