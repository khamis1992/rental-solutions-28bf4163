import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

export const useCarInstallmentContracts = () => {
  const getCarInstallmentContracts = async (): Promise<CarInstallmentContract[]> => {
    const { data, error } = await supabase
      .from('car_installment_contracts')
      .select('*');

    if (error) {
      throw new Error(error.message);
    }

    return data as CarInstallmentContract[];
  };

  return useQuery({
    queryKey: ['car-installment-contracts'],
    queryFn: getCarInstallmentContracts,
  });
};

export const useCarInstallmentPayments = (contractId: string) => {
  const getCarInstallmentPayments = async (): Promise<CarInstallmentPayment[]> => {
    const { data, error } = await supabase
      .from('car_installment_payments')
      .select('*')
      .eq('contract_id', contractId);

    if (error) {
      throw new Error(error.message);
    }

    return data as CarInstallmentPayment[];
  };

  return useQuery({
    queryKey: ['car-installment-payments', contractId],
    queryFn: getCarInstallmentPayments,
  });
};

export const useCarInstallmentAnalytics = () => {
  const getContractSummary = async () => {
    // Get total contract value
    const contractValueResponse = await supabase
      .from('car_installment_contracts')
      .select('total_contract_value, amount_paid')
      .single();

    // Safe handling to avoid property access on error
    let totalContractValue = 0;
    let totalAmountPaid = 0;
    
    if (!contractValueResponse.error && contractValueResponse.data) {
      totalContractValue = contractValueResponse.data.total_contract_value || 0;
      totalAmountPaid = contractValueResponse.data.amount_paid || 0;
    }

    // Get outstanding payments
    const overduePaymentsResponse = await supabase
      .from('car_installment_payments')
      .select('amount')
      .eq('status', 'overdue' as any)
      .single();
      
    let overdueAmount = 0;
    if (!overduePaymentsResponse.error && overduePaymentsResponse.data) {
      overdueAmount = overduePaymentsResponse.data.amount || 0;
    }

    return {
      total_contract_value: totalContractValue,
      amount_paid: totalAmountPaid,
      overdue_amount: overdueAmount,
    };
  };

  return useQuery({
    queryKey: ['car-installment-analytics'],
    queryFn: getContractSummary as any
  });
};
