
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

export interface CarInstallmentContract {
  id: string;
  customer_id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  interest_rate: number;
  loan_amount: number;
  monthly_payment: number;
  number_of_payments: number;
  status: string;
  created_at: string;
  updated_at: string;
  car_type?: string;
  model_year?: string;
}

export interface CarInstallmentPayment {
  id: string;
  contract_id: string;
  payment_date: string;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export const useCarInstallmentContracts = () => {
  const [contractFilters, setContractFilters] = useState({
    status: 'all',
    search: ''
  });
  
  const [paymentFilters, setPaymentFilters] = useState<PaymentFilters>({
    status: 'all'
  });

  const getCarInstallmentContracts = async (): Promise<CarInstallmentContract[]> => {
    const { data, error } = await supabase
      .from('car_installment_contracts')
      .select('*');

    if (error) {
      throw new Error(error.message);
    }

    return data as CarInstallmentContract[];
  };
  
  const contractsQuery = useQuery({
    queryKey: ['car-installment-contracts', contractFilters],
    queryFn: getCarInstallmentContracts,
  });
  
  const summaryQuery = useQuery({
    queryKey: ['car-installment-analytics'],
    queryFn: getContractSummary
  });
  
  const fetchContractPayments = async (contractId: string, filters?: PaymentFilters): Promise<CarInstallmentPayment[]> => {
    const { data, error } = await supabase
      .from('car_installment_payments')
      .select('*')
      .eq('contract_id', contractId as string);

    if (error) {
      throw new Error(error.message);
    }

    return data as CarInstallmentPayment[];
  };
  
  const addPayment = async (payment: Omit<CarInstallmentPayment, 'id' | 'created_at' | 'updated_at'>) => {
    // Implementation for adding a payment
    console.log('Adding payment:', payment);
    return { success: true };
  };
  
  const recordPayment = async (params: { id: string; amountPaid: number }) => {
    // Implementation for recording a payment
    console.log('Recording payment:', params);
    return { success: true };
  };
  
  const importPayments = async (params: { contractId: string; payments: any[] }) => {
    // Implementation for importing payments
    console.log('Importing payments:', params);
    return { success: true };
  };
  
  const createContract = async (contractData: Omit<CarInstallmentContract, 'id' | 'created_at' | 'updated_at'>) => {
    // Implementation for creating a contract
    console.log('Creating contract:', contractData);
    return { success: true };
  };

  return {
    contracts: contractsQuery.data || [],
    isLoadingContracts: contractsQuery.isLoading,
    error: contractsQuery.error,
    summary: summaryQuery.data,
    isLoadingSummary: summaryQuery.isLoading,
    contractFilters,
    setContractFilters,
    createContract,
    fetchContractPayments,
    paymentFilters,
    setPaymentFilters,
    addPayment,
    recordPayment,
    importPayments
  };
};

async function getContractSummary() {
  try {
    // Mock implementation for contract summary
    return {
      total_contract_value: 250000,
      amount_paid: 125000,
      overdue_amount: 15000
    };
  } catch (error) {
    console.error("Error in installment analytics:", error);
    return {
      total_contract_value: 0,
      amount_paid: 0,
      overdue_amount: 0
    };
  }
}

// For backward compatibility
export const useCarInstallments = useCarInstallmentContracts;
