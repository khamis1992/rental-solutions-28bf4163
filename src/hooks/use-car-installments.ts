
import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { PaymentStatusType, ContractSummary, CarInstallmentContract, CarInstallmentPayment } from '@/types/car-installment';
import { useToast } from '@/components/ui/use-toast';
import { Database } from '@/types/database.types';

export const useCarInstallments = () => {
  const [contracts, setContracts] = useState<CarInstallmentContract[]>([]);
  const [payments, setPayments] = useState<CarInstallmentPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ContractSummary>({
    totalContracts: 0,
    totalPortfolioValue: 0,
    totalCollections: 0,
    upcomingPayments: 0
  });
  
  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();

  // Fetch all contracts
  const fetchContracts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Cast to any to bypass TypeScript error if car_installment_contracts is not yet in types
      const { data, error } = await (supabase as any)
        .from('car_installment_contracts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Type check and safety
      const safeData = Array.isArray(data) ? data : [];
      setContracts(safeData as CarInstallmentContract[]);
    } catch (err: any) {
      console.error('Error fetching contracts:', err);
      setError(err.message || 'Failed to fetch contracts');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch contracts. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, toast]);

  // Fetch all payments
  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Cast to any to bypass TypeScript error if car_installment_payments is not yet in types
      const { data, error } = await (supabase as any)
        .from('car_installment_payments')
        .select('*')
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      
      // Type check and safety
      const safeData = Array.isArray(data) ? data : [];
      setPayments(safeData as CarInstallmentPayment[]);
    } catch (err: any) {
      console.error('Error fetching payments:', err);
      setError(err.message || 'Failed to fetch payments');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch payments. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, toast]);

  // Fetch payments by status
  const fetchPaymentsByStatus = useCallback(async (status: PaymentStatusType) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Cast to any to bypass TypeScript error
      const { data, error } = await (supabase as any)
        .from('car_installment_payments')
        .select('*')
        .eq('status', status)
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      
      // Type check and safety
      return Array.isArray(data) ? data : [];
    } catch (err: any) {
      console.error(`Error fetching ${status} payments:`, err);
      setError(err.message || `Failed to fetch ${status} payments`);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to fetch ${status} payments.`,
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [supabase, toast]);

  // Calculate summary
  const calculateSummary = useCallback(async () => {
    try {
      // Calculate total portfolio value
      const { data: portfolioData, error: portfolioError } = await (supabase as any)
        .from('car_installment_contracts')
        .select('sum(total_contract_value) as total_contract_value, sum(amount_paid) as amount_paid')
        .single();
      
      if (portfolioError) throw portfolioError;

      // Calculate upcoming payments
      const { data: upcomingData, error: upcomingError } = await (supabase as any)
        .from('car_installment_payments')
        .select('sum(amount) as amount')
        .eq('status', 'pending')
        .single();
      
      if (upcomingError) throw upcomingError;

      // Safely access data or default to 0
      const totalPortfolioValue = portfolioData?.total_contract_value || 0;
      const totalCollections = portfolioData?.amount_paid || 0;
      const upcomingPayments = upcomingData?.amount || 0;
      
      setSummary({
        totalContracts: contracts.length || 0,
        totalPortfolioValue,
        totalCollections,
        upcomingPayments
      });
    } catch (err: any) {
      console.error('Error calculating summary:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to calculate summary data.",
      });
    }
  }, [contracts.length, supabase, toast]);

  // Load data
  useEffect(() => {
    fetchContracts();
    fetchPayments();
  }, [fetchContracts, fetchPayments]);

  // Calculate summary when contracts or payments change
  useEffect(() => {
    if (contracts.length > 0) {
      calculateSummary();
    }
  }, [contracts, payments, calculateSummary]);

  // Add new contract
  const addContract = async (contractData: Omit<CarInstallmentContract, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Calculate amount_pending based on total_contract_value
      const amount_pending = contractData.total_contract_value - (contractData.amount_paid || 0);
      
      // Cast to any to bypass TypeScript error
      const { data, error } = await (supabase as any)
        .from('car_installment_contracts')
        .insert({
          ...contractData,
          amount_pending,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update state with new contract
      setContracts(prev => [data as CarInstallmentContract, ...prev]);
      
      toast({
        title: "Contract Added",
        description: "New contract has been successfully created.",
      });
      
      return data as CarInstallmentContract;
    } catch (err: any) {
      console.error('Error adding contract:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to add contract.",
      });
      throw err;
    }
  };

  // Update contract
  const updateContract = async (id: string, contractData: Partial<CarInstallmentContract>) => {
    try {
      // If remaining_installments is provided, ensure it's a number
      if (contractData.remaining_installments !== undefined) {
        contractData.remaining_installments = Number(contractData.remaining_installments);
      }
      
      // Cast to any to bypass TypeScript error
      const { data, error } = await (supabase as any)
        .from('car_installment_contracts')
        .update({
          ...contractData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update state with updated contract
      setContracts(prev => 
        prev.map(contract => contract.id === id ? (data as CarInstallmentContract) : contract)
      );
      
      toast({
        title: "Contract Updated",
        description: "Contract has been successfully updated.",
      });
      
      return data as CarInstallmentContract;
    } catch (err: any) {
      console.error('Error updating contract:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to update contract.",
      });
      throw err;
    }
  };

  // Get contract by ID
  const getContract = async (id: string) => {
    try {
      // Cast to any to bypass TypeScript error
      const { data, error } = await (supabase as any)
        .from('car_installment_contracts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return data as CarInstallmentContract;
    } catch (err: any) {
      console.error('Error fetching contract:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to fetch contract details.",
      });
      throw err;
    }
  };

  // Add new payment
  const addPayment = async (paymentData: Omit<CarInstallmentPayment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Calculate remaining amount
      const remaining = paymentData.amount - (paymentData.paid_amount || 0);
      
      // Cast to any to bypass TypeScript error
      const { data, error } = await (supabase as any)
        .from('car_installment_payments')
        .insert({
          ...paymentData,
          remaining_amount: remaining,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update state with new payment
      setPayments(prev => [data as CarInstallmentPayment, ...prev]);
      
      // Also update contract data (remaining installments)
      if (paymentData.contract_id) {
        const contract = contracts.find(c => c.id === paymentData.contract_id);
        if (contract && contract.remaining_installments > 0) {
          updateContract(paymentData.contract_id, { 
            remaining_installments: contract.remaining_installments - 1,
            amount_paid: (contract.amount_paid || 0) + (paymentData.paid_amount || 0)
          });
        }
      }
      
      toast({
        title: "Payment Added",
        description: "New payment has been successfully recorded.",
      });
      
      return data as CarInstallmentPayment;
    } catch (err: any) {
      console.error('Error adding payment:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to add payment.",
      });
      throw err;
    }
  };

  // Update payment status
  const updatePaymentStatus = async (id: string, status: PaymentStatusType, paidAmount?: number) => {
    try {
      const updates: any = { 
        status,
        updated_at: new Date().toISOString(),
        last_status_change: new Date().toISOString()
      };
      
      // If paid amount is provided, update it
      if (paidAmount !== undefined) {
        updates.paid_amount = paidAmount;
      }
      
      // Cast to any to bypass TypeScript error
      const { data, error } = await (supabase as any)
        .from('car_installment_payments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update state with updated payment
      setPayments(prev => 
        prev.map(payment => payment.id === id ? (data as CarInstallmentPayment) : payment)
      );
      
      // If payment is marked as paid, update contract's amount_paid
      if (status === 'paid' && data && data.paid_amount && data.contract_id) {
        const contract = contracts.find(c => c.id === data.contract_id);
        if (contract) {
          updateContract(data.contract_id, {
            amount_paid: (contract.amount_paid || 0) + data.paid_amount
          });
        }
      }
      
      toast({
        title: "Payment Updated",
        description: `Payment status has been updated to ${status}.`,
      });
      
      return data as CarInstallmentPayment;
    } catch (err: any) {
      console.error('Error updating payment status:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to update payment status.",
      });
      throw err;
    }
  };

  return {
    contracts,
    payments,
    isLoading,
    error,
    summary,
    fetchContracts,
    fetchPayments,
    fetchPaymentsByStatus,
    addContract,
    updateContract,
    getContract,
    addPayment,
    updatePaymentStatus
  };
};

export default useCarInstallments;
