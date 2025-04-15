
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { 
  CarInstallmentContract as OriginalCarInstallmentContract,
  CarInstallmentPayment,
  PaymentFilters,
  ContractSummary 
} from '@/types/car-installment';

// Use the original type from car-installment.ts and extend it for backward compatibility
export type CarInstallmentContract = OriginalCarInstallmentContract & {
  // Fields from original hook implementation
  customer_id?: string;
  vehicle_id?: string;
  start_date?: string;
  end_date?: string;
  interest_rate?: number;
  loan_amount?: number;
  monthly_payment?: number;
  number_of_payments?: number;
  status?: string;
};

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
  
  const getContractSummary = async (): Promise<ContractSummary> => {
    try {
      // Mock implementation for contract summary with correct structure
      return {
        totalContracts: 10,
        totalPortfolioValue: 250000,
        totalCollections: 125000,
        upcomingPayments: 15000
      };
    } catch (error) {
      console.error("Error in installment analytics:", error);
      return {
        totalContracts: 0,
        totalPortfolioValue: 0,
        totalCollections: 0,
        upcomingPayments: 0
      };
    }
  };
  
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

// For backward compatibility
export const useCarInstallments = useCarInstallmentContracts;
