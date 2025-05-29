
import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentScheduleService, PaymentScheduleItem } from '@/services/PaymentScheduleService';
import { toast } from 'sonner';

export function usePaymentScheduleManagement(agreementId?: string) {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  // Query to fetch existing payment schedule
  const {
    data: paymentSchedule = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['payment-schedule', agreementId],
    queryFn: async () => {
      if (!agreementId) return [];
      
      const result = await paymentScheduleService.getPaymentSchedule(agreementId);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to fetch payment schedule');
      }
      return result.data;
    },
    enabled: !!agreementId,
    staleTime: 300000, // 5 minutes
  });

  // Mutation to generate and persist payment schedule
  const generateScheduleMutation = useMutation({
    mutationFn: async (params: {
      agreementId: string;
      startDate: Date;
      endDate: Date;
      rentAmount: number;
      paymentFrequency: string;
      paymentDay: number;
    }) => {
      const result = await paymentScheduleService.generateAndPersistSchedule(
        params.agreementId,
        params.startDate,
        params.endDate,
        params.rentAmount,
        params.paymentFrequency,
        params.paymentDay
      );
      
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to generate payment schedule');
      }
      
      return result.data;
    },
    onSuccess: (data) => {
      toast.success(`Payment schedule generated with ${data.length} payments`);
      queryClient.invalidateQueries({ queryKey: ['payment-schedule', agreementId] });
      queryClient.invalidateQueries({ queryKey: ['payments', agreementId] });
    },
    onError: (error) => {
      toast.error(`Failed to generate payment schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Mutation to update schedule item status
  const updateScheduleItemMutation = useMutation({
    mutationFn: async (params: {
      scheduleId: string;
      status: 'completed' | 'overdue' | 'cancelled';
      actualPaymentDate?: string;
      transactionId?: string;
    }) => {
      const result = await paymentScheduleService.updateScheduleItemStatus(
        params.scheduleId,
        params.status,
        params.actualPaymentDate,
        params.transactionId
      );
      
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to update schedule item');
      }
      
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-schedule', agreementId] });
      queryClient.invalidateQueries({ queryKey: ['payments', agreementId] });
    },
    onError: (error) => {
      toast.error(`Failed to update schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Generate payment schedule
  const generatePaymentSchedule = useCallback(async (
    startDate: Date,
    endDate: Date,
    rentAmount: number,
    paymentFrequency: string,
    paymentDay: number
  ) => {
    if (!agreementId) {
      toast.error('Agreement ID is required');
      return;
    }

    setIsGenerating(true);
    try {
      await generateScheduleMutation.mutateAsync({
        agreementId,
        startDate,
        endDate,
        rentAmount,
        paymentFrequency,
        paymentDay
      });
    } finally {
      setIsGenerating(false);
    }
  }, [agreementId, generateScheduleMutation]);

  // Update schedule item status
  const updateScheduleItem = useCallback(async (
    scheduleId: string,
    status: 'completed' | 'overdue' | 'cancelled',
    actualPaymentDate?: string,
    transactionId?: string
  ) => {
    await updateScheduleItemMutation.mutateAsync({
      scheduleId,
      status,
      actualPaymentDate,
      transactionId
    });
  }, [updateScheduleItemMutation]);

  return {
    paymentSchedule,
    isLoading,
    error,
    isGenerating,
    generatePaymentSchedule,
    updateScheduleItem,
    refetch,
    isPending: {
      generate: generateScheduleMutation.isPending,
      update: updateScheduleItemMutation.isPending
    }
  };
}
