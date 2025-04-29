
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agreementService, AgreementFilters } from '@/services/AgreementService';
import { toast } from 'sonner';

/**
 * Hook for working with the Agreement Service
 */
export const useAgreementService = (initialFilters: AgreementFilters = {}) => {
  const [searchParams, setSearchParams] = useState<AgreementFilters>(initialFilters);
  const queryClient = useQueryClient();

  // Query for fetching agreements with filters
  const {
    data: agreementsResult = { data: [], count: 0 },
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['agreements', searchParams],
    queryFn: async () => {
      const result = await agreementService.findAgreements(searchParams);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to fetch agreements');
      }
      return result.data;
    },
    staleTime: 600000, // 10 minutes
    gcTime: 900000, // 15 minutes,
  });

  const agreements = agreementsResult?.data || [];
  const agreementsCount = agreementsResult?.count || 0;

  // Mutation for getting agreement details
  const getAgreement = useMutation({
    mutationFn: async (id: string) => {
      const result = await agreementService.getAgreementDetails(id);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to fetch agreement details');
      }
      return result.data;
    }
  });

  // Mutation for updating an agreement
  const updateAgreement = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      const result = await agreementService.update(id, data);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to update agreement');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('Agreement updated successfully');
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
    onError: (error) => {
      toast.error(`Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Batch update agreements
  const batchUpdateMutation = useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Record<string, any> }) => {
      const result = await agreementService.batchUpdate(ids, updates);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Batch update failed');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('Agreements updated successfully');
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
    onError: (error) => {
      toast.error(`Batch update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Batch delete agreements
  const batchDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const result = await agreementService.batchDelete(ids);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Batch delete failed');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('Agreements deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
    onError: (error) => {
      toast.error(`Batch delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Mutation for changing agreement status
  const changeStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const result = await agreementService.changeStatus(id, status);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to update agreement status');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
    onError: (error) => {
      toast.error(`Status update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Mutation for deleting an agreement
  const deleteAgreement = useMutation({
    mutationFn: async (id: string) => {
      const result = await agreementService.deleteAgreement(id);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to delete agreement');
      }
      return id;
    },
    onSuccess: () => {
      toast.success('Agreement deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
    onError: (error) => {
      toast.error(`Deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Calculate remaining amount
  const calculateRemainingAmount = useMutation({
    mutationFn: async (id: string) => {
      const result = await agreementService.calculateRemainingAmount(id);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to calculate remaining amount');
      }
      return result.data;
    }
  });

  return {
    agreements,
    agreementsCount,
    isLoading,
    error,
    searchParams,
    setSearchParams,
    refetch,
    getAgreement: getAgreement.mutateAsync,
    updateAgreement: updateAgreement.mutateAsync,
    changeStatus: changeStatus.mutateAsync,
    deleteAgreement: deleteAgreement.mutateAsync,
    calculateRemainingAmount: calculateRemainingAmount.mutateAsync,
    batchUpdate: batchUpdateMutation.mutateAsync,
    batchDelete: batchDeleteMutation.mutateAsync,
    // Expose isPending states for UI loading indicators
    isPending: {
      getAgreement: getAgreement.isPending,
      updateAgreement: updateAgreement.isPending,
      changeStatus: changeStatus.isPending,
      deleteAgreement: deleteAgreement.isPending,
      calculateRemainingAmount: calculateRemainingAmount.isPending,
      batchUpdate: batchUpdateMutation.isPending,
      batchDelete: batchDeleteMutation.isPending,
    }
  };
};
