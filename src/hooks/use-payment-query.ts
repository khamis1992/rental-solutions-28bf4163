/**
 * Payment Hooks
 * 
 * Provides React Query hooks for payment data management with proper caching,
 * loading states, and error handling.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Payment, PaymentInsert, PaymentStatus, SpecialPaymentOptions } from '@/types/payment.types';
import { paymentService } from '@/services/StandardizedPaymentService';
import { toast } from 'sonner';
import { useState } from 'react';
import { getConnectionStatus } from '@/utils/database-connection';

// Query keys
const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (filters: any) => [...paymentKeys.lists(), filters] as const,
  details: () => [...paymentKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
  statistics: (agreementId: string) => [...paymentKeys.all, 'statistics', agreementId] as const,
  agreementPayments: (agreementId: string) => 
    [...paymentKeys.all, 'agreement', agreementId] as const,
};

/**
 * Hook for payment operations with React Query integration
 */
export function usePaymentQuery() {
  const queryClient = useQueryClient();
  const [connectionStatus] = useState(getConnectionStatus());
  
  /**
   * Get payments with filtering and pagination
   */
  const getPayments = (
    filters: {
      agreementId?: string;
      status?: PaymentStatus | PaymentStatus[];
      fromDate?: Date;
      toDate?: Date;
      type?: string;
      searchTerm?: string;
    } = {},
    limit = 10,
    offset = 0
  ) => {
    return useQuery({
      queryKey: paymentKeys.list({ ...filters, limit, offset }),
      queryFn: () => paymentService.getPayments(filters, limit, offset),
      enabled: connectionStatus !== 'disconnected',
      staleTime: 5 * 60 * 1000, // 5 minutes
      keepPreviousData: true,
    });
  };
  
  /**
   * Get a single payment by ID
   */
  const getPaymentById = (id: string) => {
    return useQuery({
      queryKey: paymentKeys.detail(id),
      queryFn: () => paymentService.getPaymentById(id),
      enabled: !!id && connectionStatus !== 'disconnected',
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
  
  /**
   * Get all payments for an agreement
   */
  const getAgreementPayments = (agreementId: string) => {
    return useQuery({
      queryKey: paymentKeys.agreementPayments(agreementId),
      queryFn: () => paymentService.getPayments({ agreementId }, 100, 0),
      enabled: !!agreementId && connectionStatus !== 'disconnected',
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
  
  /**
   * Get payment statistics for an agreement
   */
  const getPaymentStatistics = (agreementId: string) => {
    return useQuery({
      queryKey: paymentKeys.statistics(agreementId),
      queryFn: () => paymentService.getPaymentStatistics(agreementId),
      enabled: !!agreementId && connectionStatus !== 'disconnected',
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };
  
  /**
   * Create a new payment
   */
  const createPayment = () => {
    return useMutation({
      mutationFn: (data: PaymentInsert) => 
        paymentService.createPayment(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
        toast.success('Payment recorded successfully');
      }
    });
  };
  
  /**
   * Process a special payment with late fee calculation
   */
  const processSpecialPayment = () => {
    return useMutation({
      mutationFn: ({
        agreementId,
        amount,
        paymentDate,
        options
      }: {
        agreementId: string,
        amount: number,
        paymentDate: Date,
        options?: SpecialPaymentOptions
      }) => paymentService.processSpecialPayment(agreementId, amount, paymentDate, options),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ 
          queryKey: paymentKeys.agreementPayments(variables.agreementId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: paymentKeys.statistics(variables.agreementId) 
        });
        queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
        toast.success('Payment processed successfully');
      }
    });
  };
  
  /**
   * Update an existing payment
   */
  const updatePayment = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string, data: Partial<Payment> }) => 
        paymentService.updatePayment(id, data),
      onSuccess: (result) => {
        if (result) {
          queryClient.invalidateQueries({ queryKey: paymentKeys.detail(result.id) });
          
          if (result.lease_id) {
            queryClient.invalidateQueries({ 
              queryKey: paymentKeys.agreementPayments(result.lease_id) 
            });
            queryClient.invalidateQueries({ 
              queryKey: paymentKeys.statistics(result.lease_id) 
            });
          }
          
          queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
          toast.success('Payment updated successfully');
        }
      }
    });
  };
  
  /**
   * Delete a payment
   */
  const deletePayment = () => {
    return useMutation({
      mutationFn: ({ id, agreementId }: { id: string, agreementId: string }) => 
        paymentService.deletePayment(id).then(result => ({ result, agreementId })),
      onSuccess: (data) => {
        if (data.agreementId) {
          queryClient.invalidateQueries({ 
            queryKey: paymentKeys.agreementPayments(data.agreementId) 
          });
          queryClient.invalidateQueries({ 
            queryKey: paymentKeys.statistics(data.agreementId) 
          });
        }
        queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
        toast.success('Payment deleted successfully');
      }
    });
  };
  
  /**
   * Generate scheduled payments
   */
  const generateScheduledPayments = () => {
    return useMutation({
      mutationFn: ({
        agreementId,
        startDate,
        endDate,
        amount,
        frequency = 'monthly'
      }: {
        agreementId: string,
        startDate: Date,
        endDate: Date,
        amount: number,
        frequency?: 'monthly' | 'weekly' | 'bi-weekly'
      }) => paymentService.generateScheduledPayments(
        agreementId, 
        startDate, 
        endDate, 
        amount, 
        frequency
      ),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ 
          queryKey: paymentKeys.agreementPayments(variables.agreementId) 
        });
        toast.success('Payment schedule generated successfully');
      }
    });
  };
  
  return {
    getPayments,
    getPaymentById,
    getAgreementPayments,
    getPaymentStatistics,
    createPayment,
    processSpecialPayment,
    updatePayment,
    deletePayment,
    generateScheduledPayments,
    connectionStatus
  };
}
