import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '@/services/PaymentService';
import { Payment, PaymentRecord, isPaymentRecord } from '@/types/payment.types';
import { PaymentInsert } from '@/types/payment-insert.types';
import { toast } from 'sonner';
import { ServiceResponse, ApiError } from '@/types/api.types';

interface SpecialPaymentOptions {
  skipLateFee?: boolean;
  applyDiscount?: boolean;
  discountAmount?: number;
  notes?: string;
  paymentMethod?: string;
  referenceNumber?: string;
}

/**
 * Helper to get error message from service response
 */
function getErrorMessage(error: string | Error | null): string {
  if (!error) return 'Unknown error';
  if (error instanceof Error) return error.message;
  return error;
}

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
        throw new Error(getErrorMessage(result.error));
      }
      return result.data;
    },
    enabled: !!agreementId,
    staleTime: // 300000 - removed unused variable// 5 minutes
  });

  // Mutation for recording a payment
  const recordPayment = useMutation({
    mutationFn: async (newPayment: PaymentInsert) => {
      const result = await paymentService.recordPayment(newPayment);
      if (!result.success) {
        throw new Error(getErrorMessage(result.error));
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
        throw new Error(getErrorMessage(result.error));
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
        throw new Error(getErrorMessage(result.error));
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
    mutationFn: async ({
      agreementId,
      amount,
      paymentDate,
      options,
    }: {
      agreementId: string;
      amount: number;
      paymentDate: Date;
      options?: {
        notes?: string;
        paymentMethod?: string;
        referenceNumber?: string;
        includeLatePaymentFee?: boolean;
        isPartialPayment?: boolean;
        paymentType?: string;
        targetPaymentId?: string;
      };
    }) => {
      const result = await paymentService.handleSpecialPayment(
        agreementId,
        amount,
        paymentDate,
        options
      );

      if (!result.success) {
        throw new Error(getErrorMessage(result.error));
      }

      if (!result.data || !isPaymentRecord(result.data)) {
        throw new Error('Invalid payment record received');
      }

      return result.data;
    },
    onSuccess: (data) => {
      toast.success('Special payment processed successfully');
      queryClient.invalidateQueries({
        queryKey: ['payments', data.lease_id],
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to process special payment');
    },
  });

  // Mutation for checking and creating missing payments
  const checkAndCreateMissingPayments = useMutation({
    mutationFn: async () => {
      const result = await paymentService.checkAndCreateMissingPayments();
      if (!result.success) {
        throw new Error(getErrorMessage(result.error));
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
        throw new Error(getErrorMessage(result.error));
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
        throw new Error(getErrorMessage(result.error));
      }
      if (!result.data) {
        throw new Error('No data returned from update operation');
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
    }
  };
};
