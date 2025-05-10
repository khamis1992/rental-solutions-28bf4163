
// Hook for managing car installment payments
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { CarInstallmentPayment, PaymentFilters, PaymentStatusType } from '@/types/car-installment';
import { toast } from 'sonner';
import { UseCarInstallmentPaymentsResult } from './types';

export function useCarInstallmentPayments(): UseCarInstallmentPaymentsResult {
  const queryClient = useQueryClient();
  const [paymentFilters, setPaymentFilters] = useState<PaymentFilters>({ status: '', dateRange: null });
  const [selectedContract, setSelectedContract] = useState<string | null>(null);

  // Get payments for a contract
  const fetchContractPayments = async (contractId: string) => {
    let query = supabase.from('car_installment_payments').select('*').eq('contract_id', contractId);

    if (paymentFilters.status) {
      query = query.eq('status', paymentFilters.status);
    }
    
    if (paymentFilters.dateRange?.from) {
      query = query.gte('payment_date', paymentFilters.dateRange.from);
    }
    
    if (paymentFilters.dateRange?.to) {
      query = query.lte('payment_date', paymentFilters.dateRange.to);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  };

  // Query payments
  const {
    data: payments = [],
    isLoading: isLoadingPayments,
    refetch: refetchPayments
  } = useQuery({
    queryKey: ['car-installment-payments', selectedContract, paymentFilters],
    queryFn: () => selectedContract ? fetchContractPayments(selectedContract) : Promise.resolve([]),
    enabled: !!selectedContract
  });

  // Update payment status
  const updatePaymentStatus = async (
    id: string, 
    status: PaymentStatusType, 
    paid_amount: number = 0
  ) => {
    try {
      const updateData: any = { status };
      
      if (status === 'paid' && paid_amount > 0) {
        updateData.paid_amount = paid_amount;
      }
      
      const { error } = await supabase
        .from('car_installment_payments')
        .update(updateData)
        .eq('id', id);
        
      if (error) throw error;
      
      await refetchPayments();
      return true;
    } catch (error: any) {
      toast.error(`Failed to update payment: ${error.message}`);
      return false;
    }
  };

  // Record payment mutation
  const recordPayment = useMutation({
    mutationFn: async (newPayment: Partial<CarInstallmentPayment>) => {
      const { data, error } = await supabase
        .from('car_installment_payments')
        .insert([newPayment])
        .select();
        
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['car-installment-payments'] });
      toast.success('Payment recorded successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to record payment: ${error.message}`);
    }
  });

  // Import payments mutation
  const importPayments = useMutation({
    mutationFn: async (params: { contractId: string, payments: Partial<CarInstallmentPayment>[] }) => {
      // Ensure each payment has the contract_id
      const paymentsWithContractId = params.payments.map(payment => ({
        ...payment,
        contract_id: params.contractId
      }));
      
      const { data, error } = await supabase
        .from('car_installment_payments')
        .insert(paymentsWithContractId)
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['car-installment-payments'] });
      toast.success('Payments imported successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to import payments: ${error.message}`);
    }
  });

  return {
    payments,
    isLoadingPayments,
    selectedContract,
    setSelectedContract,
    paymentFilters,
    setPaymentFilters,
    fetchContractPayments,
    recordPayment: recordPayment.mutate,
    importPayments: importPayments.mutate,
    updatePaymentStatus,
    addPayment: recordPayment.mutate // Alias for backward compatibility
  };
}
