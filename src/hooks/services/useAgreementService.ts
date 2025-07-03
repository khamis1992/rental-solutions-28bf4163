import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agreementService, AgreementFilters } from '@/services/AgreementService';
import { agreementDeletionService } from '@/services/AgreementDeletionService';
import { toast } from 'sonner';
import { AgreementStatus } from '@/types/agreement-types';
import { Agreement } from '@/types/agreement';
import { getErrorMessage } from '@/types/service.types';
import { useErrorHandler } from '@/hooks/useErrorHandler';

/**
 * Hook for working with the Agreement Service
 */
export const useAgreementService = (initialFilters: AgreementFilters = {}) => {
  const [searchParams, setSearchParams] = useState<AgreementFilters>(initialFilters);
  const queryClient = useQueryClient();
  
  // Use error handler
  const { handleError } = useErrorHandler();

  // Query for fetching agreements with filters
  const {
    data: agreements = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['agreements', searchParams],
    queryFn: async () => {
      try {
        console.log('Fetching agreements with filters:', searchParams);
        const result = await agreementService.fetchAgreements(searchParams);
        if (!result.success) {
          throw new Error(result.error?.toString() || 'Failed to fetch agreements');
        }
        return result.data;
      } catch (error) {
        handleError(error, {
          showToast: true,
          logError: true,
          context: { service: 'agreement', action: 'fetchAgreements', searchParams }
        });
        throw error;
      }
    },
    staleTime: 600000, // 10 minutes
    gcTime: 900000, // 15 minutes
  });

  // Function for getting agreement details
  const getAgreementDetails = async (id: string) => {
    try {
      const result = await agreementService.getAgreementById(id);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to fetch agreement details');
      }
      return result.data;
    } catch (error) {
      handleError(error, {
        showToast: true,
        logError: true,
        context: { service: 'agreement', action: 'getAgreementDetails', agreementId: id }
      });
      throw error;
    }
  };

  // Mutation for updating an agreement
  const updateAgreement = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Agreement> }) => {
      console.log('🔄 updateAgreement mutationFn called with:', { id, data });
      
      const result = await agreementService.updateAgreement(id, {
        ...data,
        updated_at: new Date().toISOString(),
      });
      
      console.log('🔍 updateAgreement result:', result);
      
      if (!result.success) {
        console.error('❌ updateAgreement failed:', result.error);
        
        // Extract meaningful error message from complex error objects
        let errorMessage = 'Failed to update agreement';
        
        if (result.error) {
          if (typeof result.error === 'string') {
            errorMessage = result.error;
          } else if (result.error instanceof Error) {
            errorMessage = result.error.message;
          } else if (typeof result.error === 'object' && result.error.message) {
            errorMessage = result.error.message;
          } else if (typeof result.error === 'object') {
            // For complex objects, try to extract useful information
            try {
              errorMessage = JSON.stringify(result.error);
            } catch {
              errorMessage = 'Failed to update agreement - complex error object';
            }
          }
        }
        
        console.error('❌ Processed error message:', errorMessage);
        throw new Error(errorMessage);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('تم تحديث العقد بنجاح');
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
    onError: (error) => {
      console.error('❌ updateAgreement onError:', error);
      handleError(error, {
        showToast: true,
        logError: true,
        context: { service: 'agreement', action: 'updateAgreement' }
      });
    }
  });

  // Mutation for changing agreement status
  const changeStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AgreementStatus }) => {
      const result = await agreementService.updateAgreement(id, { status });
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to update agreement status');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('تم تحديث حالة العقد بنجاح');
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
    onError: (error) => {
      handleError(error, {
        showToast: true,
        logError: true,
        context: { service: 'agreement', action: 'changeStatus' }
      });
    }
  });

  // Enhanced mutation for deleting an agreement with proper cascade handling
  const deleteAgreement = useMutation({
    mutationFn: async (id: string) => {
      try {
        console.log('Starting agreement deletion for ID:', id);
        
        // Use the enhanced deletion service for proper cascade handling
        const result = await agreementDeletionService.deleteAgreement(id);
        
        if (!result.success) {
          console.error('Deletion service returned error:', result.error);
          throw new Error(result.error?.toString() || 'Failed to delete agreement');
        }
        
        console.log('Agreement deletion successful:', result.data);
        return { id, deletionResult: result.data };
      } catch (error) {
        console.error('Error in deleteAgreement mutationFn:', error);
        // Re-throw the error to be caught by onError
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Delete mutation onSuccess called with:', data);
      toast.success(`تم حذف العقد بنجاح. ${data.deletionResult?.message || ''}`);
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
    onError: (error) => {
      console.error('Delete mutation onError called with:', error);
      handleError(error, {
        showToast: true,
        logError: true,
        context: { service: 'agreement', action: 'deleteAgreement' }
      });
    }
  });

  // Function to validate deletion before attempting
  const validateDeletion = async (id: string) => {
    try {
      const result = await agreementDeletionService.validateDeletion(id);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to validate deletion');
      }
      return result.data;
    } catch (error) {
      handleError(error, {
        showToast: true,
        logError: true,
        context: { service: 'agreement', action: 'validateDeletion', agreementId: id }
      });
      throw error;
    }
  };

  // Calculate remaining amount (not implemented in AgreementService, so use a placeholder)
  const calculateRemainingAmount = useMutation({
    mutationFn: async (_id: string) => {
      throw new Error('calculateRemainingAmount is not implemented');
    }
  });

  // Create new agreement
  const createAgreement = useMutation({
    mutationFn: async (data: Partial<Agreement>) => {
      const result = await agreementService.createAgreement({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to create agreement');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('تم إنشاء العقد بنجاح');
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
    onError: (error) => {
      handleError(error, {
        showToast: true,
        logError: true,
        context: { service: 'agreement', action: 'createAgreement' }
      });
    }
  });

  // Add useRealtimeUpdates function
  const useRealtimeUpdates = () => {
    // Simple implementation that refetches data periodically
    const enableRealtime = () => {
      const interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['agreements'] });
      }, 30000); // Refetch every 30 seconds
      
      return () => clearInterval(interval);
    };
    
    return { enableRealtime };
  };

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
          const typedKey = key as keyof AgreementFilters;
          if (merged[typedKey] === undefined) {
            delete merged[typedKey];
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
    // Fix: Return the mutateAsync function directly instead of wrapping it
    deleteAgreement: deleteAgreement.mutateAsync,
    calculateRemainingAmount: calculateRemainingAmount.mutateAsync,
    validateDeletion,
    useRealtimeUpdates,
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
