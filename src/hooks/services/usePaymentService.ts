
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '@/services/PaymentService';
import { Payment } from '@/types/payment.types';
import { toast } from 'sonner';

/**
 * Hook for working with the Payment Service
 */
export const usePaymentService = (agreementId?: string) => {
  const queryClient = useQueryClient();

  // Query for fetching payments for an agreement
  const {
    data: payments = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['payments', agreementId],
    queryFn: async () => {
      if (!agreementId) return [];
      
      const result = await paymentService.getPayments(agreementId);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to fetch payments');
      }
      return result.data;
    },
    enabled: !!agreementId,
    staleTime: 300000, // 5 minutes
  });

  // Mutation for recording a payment
  const recordPayment = useMutation({
    mutationFn: async (newPayment: Partial<Payment>) => {
      const result = await paymentService.recordPayment(newPayment);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to record payment');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('Payment recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['payments', agreementId] });
    },
    onError: (error) => {
      toast.error(`Failed to record payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Mutation for updating a payment
  const updatePayment = useMutation({
    mutationFn: async (paymentUpdate: { id: string; data: Partial<Payment> }) => {
      const result = await paymentService.updatePayment(paymentUpdate.id, paymentUpdate.data);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to update payment');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('Payment updated successfully');
      queryClient.invalidateQueries({ queryKey: ['payments', agreementId] });
    },
    onError: (error) => {
      toast.error(`Failed to update payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Mutation for deleting a payment
  const deletePayment = useMutation({
    mutationFn: async (paymentId: string) => {
      const result = await paymentService.deletePayment(paymentId);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to delete payment');
      }
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Payment deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['payments', agreementId] });
    },
    onError: (error) => {
      toast.error(`Failed to delete payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Mutation for handling special payments with late fee calculation
  const handleSpecialPayment = useMutation({
    mutationFn: async (params: { 
      agreementId: string; 
      amount: number; 
      paymentDate: Date; 
      options?: any 
    }) => {
      const result = await paymentService.handleSpecialPayment(
        params.agreementId, 
        params.amount, 
        params.paymentDate, 
        params.options
      );
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to process special payment');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('Payment processed successfully');
      queryClient.invalidateQueries({ queryKey: ['payments', agreementId] });
    },
    onError: (error) => {
      toast.error(`Payment processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Mutation for checking and creating missing payments
  const checkAndCreateMissingPayments = useMutation({
    mutationFn: async () => {
      const result = await paymentService.checkAndCreateMissingPayments();
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to check payment schedules');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('Payment schedules checked and updated');
      if (agreementId) {
        queryClient.invalidateQueries({ queryKey: ['payments', agreementId] });
      }
    },
    onError: (error) => {
      toast.error(`Payment schedule check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Mutation for fixing agreement payments
  const fixAgreementPayments = useMutation({
    mutationFn: async (id: string) => {
      const result = await paymentService.fixAgreementPayments(id);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to fix agreement payments');
      }
      return result.data;
    },
    onSuccess: (data) => {
      toast.success(`Payment records fixed successfully: ${data.fixedCount} issues resolved`);
      queryClient.invalidateQueries({ queryKey: ['payments', agreementId] });
    },
    onError: (error) => {
      toast.error(`Failed to fix payments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // New mutation for updating historical payment statuses
  const updateHistoricalPaymentStatuses = useMutation({
    mutationFn: async (params: { agreementId: string; cutoffDate: Date }) => {
      const result = await paymentService.updateHistoricalPaymentStatuses(params.agreementId, params.cutoffDate);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to update historical payment statuses');
      }
      return result.data;
    },
    onSuccess: (data) => {
      toast.success(`${data.updatedCount} historical payment records updated to completed status`);
      queryClient.invalidateQueries({ queryKey: ['payments', agreementId] });
    },
    onError: (error) => {
      toast.error(`Failed to update payment statuses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  return {
    payments,
    isLoading,
    error,
    recordPayment: recordPayment.mutateAsync,
    updatePayment: updatePayment.mutateAsync,
    deletePayment: deletePayment.mutateAsync,
    handleSpecialPayment: handleSpecialPayment.mutateAsync,
    checkAndCreateMissingPayments: checkAndCreateMissingPayments.mutateAsync,
    fixAgreementPayments: fixAgreementPayments.mutateAsync,
    updateHistoricalPaymentStatuses: updateHistoricalPaymentStatuses.mutateAsync,
    refetch,
    // Expose isPending states for UI loading indicators
    isPending: {
      recordPayment: recordPayment.isPending,
      updatePayment: updatePayment.isPending,
      deletePayment: deletePayment.isPending,
      handleSpecialPayment: handleSpecialPayment.isPending,
      checkAndCreateMissingPayments: checkAndCreateMissingPayments.isPending,
      fixAgreementPayments: fixAgreementPayments.isPending,
      updateHistoricalPaymentStatuses: updateHistoricalPaymentStatuses.isPending
    },
    // Add the getTrafficFines method to match what's expected in AgreementTrafficFines
    getTrafficFines: (id: string) => {
      return { data: [], isLoading: false, error: null };
    }
  };
};
