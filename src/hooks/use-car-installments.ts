
import { useState } from 'react';
import { useApiMutation, useApiQuery } from './use-api';
import { supabase } from '@/integrations/supabase/client';
import { 
  CarInstallmentContract, 
  CarInstallmentPayment,
  ContractSummary,
  ImportedPayment,
  ContractFilters,
  PaymentFilters,
  InstallmentStatus
} from '@/types/car-installment';
import { useToast } from './use-toast';
import { PaymentStatus } from '@/lib/database/types';
import { Database } from '@/types/database.types';

type DbTables = Database['public']['Tables'];
type ContractInsert = DbTables['car_installment_contracts']['Insert'];
type PaymentInsert = DbTables['car_installment_payments']['Insert'];
type PaymentUpdate = DbTables['car_installment_payments']['Update'];

// Helper function to safely handle and cast Supabase responses
function safelyHandleResponse<T>(response: any, defaultValue: T): T {
  if (response?.error) {
    console.error('Supabase query error:', response.error);
    return defaultValue;
  }
  return (response?.data || defaultValue) as T;
}

export function useCarInstallments() {
  const { toast } = useToast();
  const [contractFilters, setContractFilters] = useState<ContractFilters>({
    search: '',
    status: 'all',
  });
  
  const [paymentFilters, setPaymentFilters] = useState<PaymentFilters>({
    status: 'all',
  });

  // Fetch summary metrics
  const {
    data: summary,
    isLoading: isLoadingSummary,
    refetch: refetchSummary
  } = useApiQuery<ContractSummary>(
    ['carInstallmentSummary'],
    async () => {
      try {
        // Get all contracts for total calculation
        const { data: contracts, error: contractsError } = await supabase
          .from('car_installment_contracts')
          .select('total_contract_value, amount_paid');
          
        if (contractsError) throw contractsError;
          
        // Calculate upcoming payments (due in 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        const { data: upcomingPayments, error: paymentsError } = await supabase
          .from('car_installment_payments')
          .select('amount')
          .lte('payment_date', thirtyDaysFromNow.toISOString())
          .gt('payment_date', new Date().toISOString())
          .eq('status', 'pending' as PaymentStatus);
        
        if (paymentsError) throw paymentsError;
        
        if (!contracts) {
          throw new Error('Failed to fetch contract data');
        }
        
        // Check if contracts array exists before reducing
        const totalPortfolioValue = Array.isArray(contracts) ? contracts.reduce((sum, contract) => {
          return sum + (contract?.total_contract_value || 0);
        }, 0) : 0;
          
        const totalCollections = Array.isArray(contracts) ? contracts.reduce((sum, contract) => {
          return sum + (contract?.amount_paid || 0);
        }, 0) : 0;
          
        const upcomingPaymentsTotal = Array.isArray(upcomingPayments) ? upcomingPayments.reduce((sum, payment) => {
          return sum + (payment?.amount || 0);
        }, 0) : 0;
        
        return {
          totalContracts: contracts.length,
          totalPortfolioValue,
          totalCollections,
          upcomingPayments: upcomingPaymentsTotal
        };
      } catch (error) {
        console.error('Error fetching car installment summary:', error);
        throw error;
      }
    }
  );

  // Fetch all contracts
  const {
    data: contracts,
    isLoading: isLoadingContracts,
    refetch: refetchContracts
  } = useApiQuery<CarInstallmentContract[]>(
    ['carInstallmentContracts', JSON.stringify(contractFilters)],
    async () => {
      try {
        let query = supabase
          .from('car_installment_contracts')
          .select('*')
          .order('created_at', { ascending: false });
        
        // Apply filters
        if (contractFilters.search) {
          query = query.ilike('car_type', `%${contractFilters.search}%`);
        }
        
        if (contractFilters.status && contractFilters.status !== 'all') {
          if (contractFilters.status === 'active') {
            query = query.gt('remaining_installments', 0);
          } else if (contractFilters.status === 'completed') {
            query = query.eq('remaining_installments', 0);
          } else if (contractFilters.status === 'overdue') {
            query = query.gt('overdue_payments', 0);
          }
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        return safelyHandleResponse<CarInstallmentContract[]>(
          { data, error }, 
          []
        );
      } catch (error) {
        console.error('Error fetching car installment contracts:', error);
        throw error;
      }
    }
  );

  // Fetch a single contract
  const fetchContract = async (id: string): Promise<CarInstallmentContract> => {
    try {
      const { data, error } = await supabase
        .from('car_installment_contracts')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        throw error;
      }
      
      return data as CarInstallmentContract;
    } catch (error) {
      console.error('Error fetching contract:', error);
      throw error;
    }
  };

  // Fetch payments for a contract
  const fetchContractPayments = async (
    contractId: string, 
    filters: PaymentFilters
  ): Promise<CarInstallmentPayment[]> => {
    try {
      let query = supabase
        .from('car_installment_payments')
        .select('*')
        .eq('contract_id', contractId)
        .order('payment_date', { ascending: true });
      
      // Apply filters
      if (filters.status && filters.status !== 'all') {
        // Cast the status to string for the comparison
        query = query.eq('status', filters.status.toString());
      }
      
      if (filters.dateFrom) {
        query = query.gte('payment_date', new Date(filters.dateFrom).toISOString());
      }
      
      if (filters.dateTo) {
        query = query.lte('payment_date', new Date(filters.dateTo).toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return safelyHandleResponse<CarInstallmentPayment[]>(
        { data, error }, 
        []
      );
    } catch (error) {
      console.error('Error fetching contract payments:', error);
      throw error;
    }
  };

  // Create a new contract
  const createContractMutation = useApiMutation<
    CarInstallmentContract,
    Omit<CarInstallmentContract, 'id' | 'created_at' | 'updated_at'>
  >(
    async (contractData) => {
      try {
        // Include all required fields
        const contractToInsert: ContractInsert = {
          car_type: contractData.car_type,
          model_year: contractData.model_year,
          number_of_cars: contractData.number_of_cars,
          price_per_car: contractData.price_per_car,
          total_contract_value: contractData.total_contract_value,
          total_installments: contractData.total_installments,
          installment_value: contractData.installment_value,
          amount_paid: 0,
          amount_pending: contractData.total_contract_value,
          remaining_installments: contractData.total_installments,
          overdue_payments: 0,
          category: contractData.category || 'car-finance' // Ensure category is always present
        };
        
        const { data, error } = await supabase
          .from('car_installment_contracts')
          .insert(contractToInsert) // Single object without array
          .select()
          .single();
          
        if (error) {
          throw error;
        }
        
        // Type casting to ensure the return type is correct
        return data as CarInstallmentContract;
      } catch (error) {
        console.error('Error creating car installment contract:', error);
        throw error;
      }
    },
    {
      onSuccess: () => {
        toast({
          title: 'Contract created',
          description: 'Car installment contract has been created successfully.'
        });
        refetchContracts();
        refetchSummary();
      }
    }
  );

  // Add a payment to a contract
  const addPaymentMutation = useApiMutation<
    CarInstallmentPayment,
    Omit<CarInstallmentPayment, 'id' | 'created_at' | 'updated_at'>
  >(
    async (paymentData) => {
      try {
        const paymentToInsert: PaymentInsert = {
          contract_id: paymentData.contract_id,
          cheque_number: paymentData.cheque_number,
          drawee_bank: paymentData.drawee_bank,
          amount: paymentData.amount,
          payment_date: paymentData.payment_date,
          status: paymentData.status as string || 'pending',
          paid_amount: 0,
          remaining_amount: paymentData.amount
        };
        
        const { data, error } = await supabase
          .from('car_installment_payments')
          .insert(paymentToInsert) // Single object without array
          .select()
          .single();
          
        if (error) {
          throw error;
        }
        
        return data as CarInstallmentPayment;
      } catch (error) {
        console.error('Error adding car installment payment:', error);
        throw error;
      }
    },
    {
      onSuccess: () => {
        toast({
          title: 'Payment added',
          description: 'Car installment payment has been added successfully.'
        });
      }
    }
  );

  // Update a payment
  const updatePaymentMutation = useApiMutation<
    CarInstallmentPayment,
    { id: string; data: Partial<CarInstallmentPayment> }
  >(
    async ({ id, data }) => {
      try {
        // Cast to the database update type
        const updateData: PaymentUpdate = {
          ...(data as PaymentUpdate)
        };
        
        const { data: updatedPayment, error } = await supabase
          .from('car_installment_payments')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();
          
        if (error) {
          throw error;
        }
        
        return updatedPayment as CarInstallmentPayment;
      } catch (error) {
        console.error('Error updating car installment payment:', error);
        throw error;
      }
    },
    {
      onSuccess: () => {
        toast({
          title: 'Payment updated',
          description: 'Car installment payment has been updated successfully.'
        });
      }
    }
  );

  // Record a payment (partial or full)
  const recordPaymentMutation = useApiMutation<
    CarInstallmentPayment,
    { id: string; amountPaid: number }
  >(
    async ({ id, amountPaid }) => {
      try {
        // First get the payment to check the amount
        const { data: payment, error: fetchError } = await supabase
          .from('car_installment_payments')
          .select('*')
          .eq('id', id)
          .single();
          
        if (fetchError || !payment) {
          throw fetchError || new Error('Payment not found');
        }
        
        // Calculate the new paid and remaining amounts
        const newPaidAmount = (payment.paid_amount || 0) + amountPaid;
        const newRemainingAmount = payment.amount - newPaidAmount;
        
        // Determine the new status
        let newStatus: InstallmentStatus = payment.status as unknown as InstallmentStatus;
        if (newRemainingAmount <= 0) {
          newStatus = 'paid';
        } else if (newStatus === 'overdue') {
          // Keep as overdue if it was overdue
          newStatus = 'overdue';
        } else {
          newStatus = 'pending';
        }
        
        // Update the payment
        const updateData: PaymentUpdate = {
          paid_amount: newPaidAmount,
          remaining_amount: Math.max(0, newRemainingAmount),
          status: newStatus.toString()
        };
        
        const { data: updatedPayment, error } = await supabase
          .from('car_installment_payments')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();
          
        if (error) {
          throw error;
        }
        
        // Update the contract totals
        if (updatedPayment.contract_id) {
          const { data: contractData } = await supabase
            .from('car_installment_contracts')
            .select('*')
            .eq('id', updatedPayment.contract_id)
            .single();
            
          if (contractData) {
            // Get all payments for this contract to recalculate totals
            const { data: paymentsData } = await supabase
              .from('car_installment_payments')
              .select('amount, paid_amount, status')
              .eq('contract_id', updatedPayment.contract_id);
              
            if (paymentsData) {
              const totalPaid = paymentsData.reduce((sum, p) => sum + (p.paid_amount || 0), 0);
              const overduePayments = paymentsData.filter(p => p.status === 'overdue').length;
              const paidPayments = paymentsData.filter(p => p.status === 'paid').length;
              
              await supabase
                .from('car_installment_contracts')
                .update({
                  amount_paid: totalPaid,
                  amount_pending: contractData.total_contract_value - totalPaid,
                  remaining_installments: contractData.total_installments - paidPayments,
                  overdue_payments: overduePayments
                })
                .eq('id', updatedPayment.contract_id);
            }
          }
        }
        
        return updatedPayment as CarInstallmentPayment;
      } catch (error) {
        console.error('Error recording payment:', error);
        throw error;
      }
    },
    {
      onSuccess: () => {
        toast({
          title: 'Payment recorded',
          description: 'Payment has been recorded successfully.'
        });
        refetchSummary();
      }
    }
  );

  // Import multiple payments
  const importPaymentsMutation = useApiMutation<
    { success: boolean; count: number },
    { contractId: string; payments: ImportedPayment[] }
  >(
    async ({ contractId, payments }) => {
      try {
        // Fix the type issues by explicitly specifying the payment status
        const formattedPayments = payments.map(payment => ({
          contract_id: contractId,
          cheque_number: payment.cheque_number,
          drawee_bank: payment.drawee_bank,
          amount: payment.amount,
          paid_amount: 0,
          remaining_amount: payment.amount,
          payment_date: payment.payment_date,
          status: 'pending',
          payment_notes: payment.notes || ''
        }));
        
        // Use individual inserts to avoid type issues
        for (const payment of formattedPayments) {
          const { error } = await supabase
            .from('car_installment_payments')
            .insert(payment);
            
          if (error) {
            throw error;
          }
        }
        
        // Update contract with new installment count
        const { data: contract } = await supabase
          .from('car_installment_contracts')
          .select('*')
          .eq('id', contractId)
          .single();
        
        if (contract) {
          await supabase
            .from('car_installment_contracts')
            .update({
              total_installments: contract.total_installments + payments.length,
              remaining_installments: contract.remaining_installments + payments.length
            })
            .eq('id', contractId);
        }
        
        return { success: true, count: payments.length };
      } catch (error) {
        console.error('Error importing payments:', error);
        throw error;
      }
    },
    {
      onSuccess: (data) => {
        toast({
          title: 'Payments imported',
          description: `Successfully imported ${data.count} payments.`
        });
        refetchSummary();
      }
    }
  );

  return {
    // Data
    contracts,
    isLoadingContracts,
    summary,
    isLoadingSummary,
    
    // Filters
    contractFilters,
    setContractFilters,
    paymentFilters,
    setPaymentFilters,
    
    // Operations
    fetchContract,
    fetchContractPayments,
    createContract: createContractMutation.mutate,
    isCreatingContract: createContractMutation.isPending,
    addPayment: addPaymentMutation.mutate,
    isAddingPayment: addPaymentMutation.isPending,
    updatePayment: updatePaymentMutation.mutate,
    isUpdatingPayment: updatePaymentMutation.isPending,
    recordPayment: recordPaymentMutation.mutate,
    isRecordingPayment: recordPaymentMutation.isPending,
    importPayments: importPaymentsMutation.mutate,
    isImportingPayments: importPaymentsMutation.isPending,
    
    // Refetch helpers
    refetchContracts,
    refetchSummary
  };
}
