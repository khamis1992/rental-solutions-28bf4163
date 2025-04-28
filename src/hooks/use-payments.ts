
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PaymentService, PaymentData, PaymentFilterOptions } from '@/services/payments/payments-service';

export type { PaymentData } from '@/services/payments/payments-service';

export const usePayments = (initialFilters: PaymentFilterOptions = {}) => {
  const [filterParams, setFilterParams] = useState<PaymentFilterOptions>(initialFilters);
  const queryClient = useQueryClient();

  // Query for fetching payments with filters
  const {
    data: payments,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['payments', filterParams],
    queryFn: () => PaymentService.fetchPayments(filterParams),
    staleTime: 300000, // 5 minutes
    gcTime: 600000,    // 10 minutes
  });

  // Query for fetching a single payment
  const fetchPayment = async (id: string): Promise<PaymentData | null> => {
    return await PaymentService.getPayment(id);
  };

  // Mutation for recording a new payment
  const recordPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const newPayment = await PaymentService.recordPayment(paymentData);
      if (!newPayment) {
        throw new Error('Failed to record payment');
      }
      return newPayment;
    },
    onSuccess: () => {
      toast.success('Payment recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to record payment: ${error.message || 'Unknown error'}`);
    }
  });

  // Mutation for updating a payment
  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const updatedPayment = await PaymentService.updatePayment(id, data);
      if (!updatedPayment) {
        throw new Error('Failed to update payment');
      }
      return updatedPayment;
    },
    onSuccess: () => {
      toast.success('Payment updated successfully');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to update payment: ${error.message || 'Unknown error'}`);
    }
  });

  // Mutation for deleting a payment
  const deletePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      const success = await PaymentService.deletePayment(id);
      if (!success) {
        throw new Error('Failed to delete payment');
      }
      return id;
    },
    onSuccess: () => {
      toast.success('Payment deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to delete payment: ${error.message || 'Unknown error'}`);
    }
  });

  // Advanced function to record payment with late fee calculation
  const recordPaymentWithLateFee = async (
    leaseId: string, 
    amount: number,
    amountPaid: number,
    paymentMethod: string,
    paymentDate: Date,
    dueDate: Date,
    description?: string
  ): Promise<PaymentData | null> => {
    const payment = await PaymentService.recordPaymentWithLateFee(
      leaseId, 
      amount, 
      amountPaid, 
      paymentMethod, 
      paymentDate, 
      dueDate, 
      description
    );
    
    if (payment) {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    }
    
    return payment;
  };

  // Get payment statistics for a lease
  const getPaymentStats = async (leaseId: string) => {
    return await PaymentService.getPaymentStats(leaseId);
  };

  return {
    payments,
    isLoading,
    error,
    filterParams,
    setFilterParams,
    fetchPayment,
    recordPayment: recordPaymentMutation.mutateAsync,
    updatePayment: updatePaymentMutation.mutateAsync,
    deletePayment: deletePaymentMutation.mutateAsync,
    recordPaymentWithLateFee,
    getPaymentStats,
    refetchPayments: refetch
  };
};
