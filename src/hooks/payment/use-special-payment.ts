
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { paymentService } from '@/services/PaymentService';

export interface SpecialPaymentOptions {
  notes?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  includeLatePaymentFee?: boolean;
  isPartialPayment?: boolean;
  paymentType?: string;
  targetPaymentId?: string;
}

/**
 * Hook for handling special payments with late fee calculation
 */
export function useSpecialPayment(agreementId?: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      amount,
      paymentDate,
      options = {}
    }: {
      amount: number;
      paymentDate: Date;
      options?: SpecialPaymentOptions;
    }) => {
      if (!agreementId) {
        throw new Error('Agreement ID is required');
      }

      const result = await paymentService.handleSpecialPayment(
        agreementId,
        amount,
        paymentDate,
        options
      );

      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to process payment');
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

  return {
    handleSpecialPayment: mutation.mutateAsync,
    isProcessing: mutation.isPending
  };
}
