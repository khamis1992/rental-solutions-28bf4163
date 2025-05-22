
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agreementService, AgreementFilters } from '@/services/AgreementService';
import { usePagination } from '@/hooks/usePagination';
import { toast } from 'sonner';

/**
 * Hook for working with the Agreement Service
 */
export const useAgreementService = (initialFilters: AgreementFilters = {}) => {
  const [searchParams, setSearchParams] = useState(initialFilters as AgreementFilters);
  const queryClient = useQueryClient();
  const [totalItems, setTotalItems] = useState(0);
  
  const pagination = usePagination({
    totalItems, 
    initialPage: Number(initialFilters.page) || 1,
    itemsPerPage: 25
  });

  // Query for fetching agreements with filters
  const {
    data: agreements = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['agreements', searchParams, pagination.currentPage, pagination.itemsPerPage],
    queryFn: async () => {
      console.log('Fetching agreements with filters:', searchParams);
      const paginatedFilters = {
        ...searchParams,
        limit: pagination.itemsPerPage,
        offset: (pagination.currentPage - 1) * pagination.itemsPerPage
      };
      const result = await agreementService.findAgreements(paginatedFilters);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to fetch agreements');
      }
      if (result.count !== undefined) {
        setTotalItems(result.count);
      }
      return result.data;
    },
    staleTime: 600000, // 10 minutes
    gcTime: 900000, // 15 minutes
  });

  // Function for getting agreement details
  const getAgreementDetails = async (id: string) => {
    const result = await agreementService.getAgreementDetails(id);
    if (!result.success) {
      throw new Error(result.error?.toString() || 'Failed to fetch agreement details');
    }
    return result.data;
  };

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

  // Create new agreement
  const createAgreement = useMutation({
    mutationFn: async (data: any) => {
      const result = await agreementService.save(data);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to create agreement');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('Agreement created successfully');
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
    onError: (error) => {
      toast.error(`Creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  return {
    agreements,
    isLoading,
    error,
    searchParams,
    setSearchParams: (newParams: AgreementFilters) => {
      setSearchParams(prev => {
        const merged = { ...prev, ...newParams };
        
        // Remove undefined values
        Object.keys(merged).forEach(key => {
          if (merged[key] === undefined) {
            delete merged[key];
          }
        });
        
        return merged;
      });
    },
    refetch,
    getAgreementDetails,
    createAgreement: createAgreement.mutateAsync,
    updateAgreement: updateAgreement.mutateAsync,
    changeStatus: changeStatus.mutateAsync,
    deleteAgreement: deleteAgreement.mutateAsync,
    calculateRemainingAmount: calculateRemainingAmount.mutateAsync,
    pagination: {
      page: pagination.currentPage,
      pageSize: pagination.itemsPerPage,
      totalCount: totalItems,
      totalPages: pagination.totalPages,
      handlePageChange: pagination.setPage,
      setItemsPerPage: pagination.setItemsPerPage
    },
    // Expose isPending states for UI loading indicators
    isPending: {
      getAgreement: false,
      createAgreement: createAgreement.isPending,
      updateAgreement: updateAgreement.isPending,
      changeStatus: changeStatus.isPending,
      deleteAgreement: deleteAgreement.isPending,
      calculateRemainingAmount: calculateRemainingAmount.isPending,
    }
  };
};
