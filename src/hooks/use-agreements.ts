
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgreementService, SimpleAgreement, FetchAgreementsOptions } from '@/services/agreements/agreements-service';
import { AgreementStatus } from '@/lib/validation-schemas/agreement';
import { toast } from 'sonner';
import { BasicMutationResult } from '@/utils/type-utils';

export type { SimpleAgreement } from '@/services/agreements/agreements-service';
export { mapDBStatusToEnum } from '@/services/agreements/agreements-service';

export const useAgreements = (initialFilters: FetchAgreementsOptions = {}) => {
  const [searchParams, setSearchParams] = useState<FetchAgreementsOptions>(initialFilters);
  const queryClient = useQueryClient();

  // Query for fetching agreements
  const { 
    data: agreements, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['agreements', searchParams],
    queryFn: () => AgreementService.fetchAgreements(searchParams),
    staleTime: 600000, // 10 minutes
    gcTime: 900000,    // 15 minutes
  });

  // Query function for a single agreement
  const getAgreement = useCallback(async (id: string): Promise<SimpleAgreement | null> => {
    try {
      return await AgreementService.getAgreement(id);
    } catch (err) {
      console.error("Error in getAgreement:", err);
      return null;
    }
  }, []);

  // Mutation for updating an agreement
  const updateAgreementMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      try {
        const stringId = String(id);
        const updatedData = await AgreementService.updateAgreement(stringId, data);
        return { success: true, data: updatedData };
      } catch (err) {
        console.error("Error in updateAgreement:", err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
  });

  // Mutation for deleting an agreement
  const deleteAgreement = useMutation({
    mutationFn: async (id: string) => {
      const success = await AgreementService.deleteAgreement(id);
      if (!success) {
        throw new Error('Failed to delete agreement');
      }
      return { success: true, data: id };
    },
    onSuccess: () => {
      toast.success('Agreement deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
    onError: (error) => {
      toast.error(`Failed to delete agreement: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  // Simple placeholders for future implementation
  const createAgreement = async (data: Partial<SimpleAgreement>): Promise<SimpleAgreement> => {
    // This will be implemented in the future
    return {} as SimpleAgreement;
  };

  // Format update mutation to match existing API
  const updateAgreement: BasicMutationResult = {
    mutateAsync: updateAgreementMutation.mutateAsync,
    isPending: updateAgreementMutation.isPending,
    isError: updateAgreementMutation.isError,
    error: updateAgreementMutation.error
  };

  return {
    agreements,
    isLoading,
    error,
    searchParams,
    setSearchParams,
    getAgreement,
    createAgreement,
    updateAgreement,
    deleteAgreement,
  };
};
