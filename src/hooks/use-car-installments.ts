
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { CarInstallmentContract, CarInstallmentPayment, ContractFilters, ContractSummary, PaymentFilters, PaymentStatusType } from '@/types/car-installment';
import { toast } from 'sonner';

export const useCarInstallments = () => {
  const queryClient = useQueryClient();
  const [contractFilters, setContractFilters] = useState<ContractFilters>({ search: '', status: '' });
  const [paymentFilters, setPaymentFilters] = useState<PaymentFilters>({ status: '', dateRange: null });
  const [selectedContract, setSelectedContract] = useState<string | null>(null);

  // Query contracts
  const {
    data: contracts = [],
    isLoading: isLoadingContracts,
    error: contractsError
  } = useQuery({
    queryKey: ['car-installment-contracts', contractFilters],
    queryFn: async () => {
      let query = supabase.from('car_installment_contracts').select('*');

      if (contractFilters.status) {
        query = query.eq('status', contractFilters.status);
      }
      
      if (contractFilters.search) {
        query = query.ilike('car_type', `%${contractFilters.search}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    }
  });

  // Query summary
  const {
    data: summary = { totalContracts: 0, totalPortfolioValue: 0, totalCollections: 0, upcomingPayments: 0 },
    isLoading: isLoadingSummary
  } = useQuery({
    queryKey: ['car-installment-summary'],
    queryFn: async () => {
      try {
        // Get count of contracts
        const { count: totalContracts } = await supabase
          .from('car_installment_contracts')
          .select('*', { count: 'exact', head: true });
        
        // Get total portfolio value and amount paid
        const { data: totalsData } = await supabase
          .from('car_installment_contracts')
          .select('total_contract_value, amount_paid')
          .or('total_contract_value.gte.0,amount_paid.gte.0');
          
        // Calculate totals from the returned data
        let totalPortfolioValue = 0;
        let totalCollections = 0;
        
        if (totalsData && totalsData.length > 0) {
          totalPortfolioValue = totalsData.reduce((sum, item) => 
            sum + (typeof item.total_contract_value === 'number' ? item.total_contract_value : 0), 0);
          
          totalCollections = totalsData.reduce((sum, item) => 
            sum + (typeof item.amount_paid === 'number' ? item.amount_paid : 0), 0);
        }
        
        // Get upcoming payments
        const { data: upcomingData } = await supabase
          .from('car_installment_payments')
          .select('amount')
          .eq('status', 'pending');
        
        const upcomingPayments = upcomingData ? 
          upcomingData.reduce((sum, item) => sum + (item.amount || 0), 0) : 0;
        
        return {
          totalContracts: totalContracts || 0,
          totalPortfolioValue,
          totalCollections,
          upcomingPayments
        };
      } catch (error) {
        console.error('Error fetching summary:', error);
        return { totalContracts: 0, totalPortfolioValue: 0, totalCollections: 0, upcomingPayments: 0 };
      }
    }
  });

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

  // Create contract mutation
  const createContract = useMutation({
    mutationFn: async (newContract: Omit<CarInstallmentContract, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('car_installment_contracts')
        .insert([newContract])
        .select();
        
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['car-installment-contracts'] });
      queryClient.invalidateQueries({ queryKey: ['car-installment-summary'] });
      toast.success('Contract created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create contract: ${error.message}`);
    }
  });

  // Update payment status mutation
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

  // Force a refresh of all data
  const fetchContracts = () => {
    queryClient.invalidateQueries({ queryKey: ['car-installment-contracts'] });
    queryClient.invalidateQueries({ queryKey: ['car-installment-summary'] });
  };

  // Combined loading state
  const isLoading = isLoadingContracts || isLoadingSummary;
  const error = contractsError;

  return {
    contracts,
    payments,
    isLoading,
    error,
    summary,
    selectedContract,
    setSelectedContract,
    contractFilters,
    setContractFilters,
    paymentFilters,
    setPaymentFilters,
    fetchContracts,
    fetchContractPayments,
    createContract: createContract.mutate,
    recordPayment: recordPayment.mutate,
    importPayments: importPayments.mutate,
    updatePaymentStatus,
    isLoadingContracts,
    isLoadingSummary,
    isLoadingPayments,
    addPayment: recordPayment.mutate // Added this line to fix the error
  };
};
