
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { PaymentStatusType, ContractSummary, CarInstallmentContract, CarInstallmentPayment, ContractFilters, PaymentFilters } from '@/types/car-installment';
import { useToast } from '@/components/ui/use-toast';
import { Database } from '@/types/database.types';

// Create a Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export const useCarInstallments = () => {
  const [contracts, setContracts] = useState<CarInstallmentContract[]>([]);
  const [payments, setPayments] = useState<CarInstallmentPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingContracts, setIsLoadingContracts] = useState(true);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ContractSummary>({
    totalContracts: 0,
    totalPortfolioValue: 0,
    totalCollections: 0,
    upcomingPayments: 0
  });
  
  // Initialize filters state
  const [contractFilters, setContractFilters] = useState<ContractFilters>({
    search: '',
    status: undefined
  });
  
  const [paymentFilters, setPaymentFilters] = useState<PaymentFilters>({
    status: 'all',
    dateFrom: undefined,
    dateTo: undefined
  });
  
  const { toast } = useToast();

  // Fetch all contracts
  const fetchContracts = useCallback(async () => {
    setIsLoadingContracts(true);
    setError(null);
    
    try {
      // Cast to any to bypass TypeScript error if car_installment_contracts is not yet in types
      const { data, error } = await supabase
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
      setIsLoadingContracts(false);
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch all payments
  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Cast to any to bypass TypeScript error if car_installment_payments is not yet in types
      const { data, error } = await supabase
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
  }, [toast]);

  // Fetch payments by contract id
  const fetchContractPayments = useCallback(async (contractId: string, filters?: PaymentFilters) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('car_installment_payments')
        .select('*')
        .eq('contract_id', contractId);
        
      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.dateFrom) {
        query = query.gte('payment_date', filters.dateFrom);
      }
      
      if (filters?.dateTo) {
        query = query.lte('payment_date', filters.dateTo);
      }
      
      query = query.order('payment_date', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Type check and safety
      const safeData = Array.isArray(data) ? data : [];
      return safeData as CarInstallmentPayment[];
    } catch (err: any) {
      console.error('Error fetching contract payments:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to fetch payments for contract ${contractId}.`,
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch payments by status
  const fetchPaymentsByStatus = useCallback(async (status: PaymentStatusType) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Cast to any to bypass TypeScript error
      const { data, error } = await supabase
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
  }, [toast]);

  // Calculate summary
  const calculateSummary = useCallback(async () => {
    setIsLoadingSummary(true);
    try {
      // Calculate total portfolio value
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('car_installment_contracts')
        .select('sum(total_contract_value) as total_contract_value, sum(amount_paid) as amount_paid')
        .single();
      
      if (portfolioError) throw portfolioError;

      // Calculate upcoming payments
      const { data: upcomingData, error: upcomingError } = await supabase
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
    } finally {
      setIsLoadingSummary(false);
    }
  }, [contracts.length, toast]);

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
  const createContract = async (contractData: Omit<CarInstallmentContract, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Calculate amount_pending based on total_contract_value
      const amount_pending = contractData.total_contract_value - (contractData.amount_paid || 0);
      
      // Cast to any to bypass TypeScript error
      const { data, error } = await supabase
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
      const { data, error } = await supabase
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
      const { data, error } = await supabase
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
      const { data, error } = await supabase
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

  // Record payment with existing installment
  const recordPayment = async ({id, amountPaid}: {id: string, amountPaid: number}) => {
    try {
      const payment = payments.find(p => p.id === id);
      
      if (!payment) {
        throw new Error('Payment record not found');
      }
      
      const updates = {
        paid_amount: amountPaid,
        remaining_amount: Math.max(0, payment.amount - amountPaid),
        status: (amountPaid >= payment.amount) ? 'paid' as PaymentStatusType : payment.status,
        last_payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('car_installment_payments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update state
      setPayments(prev => prev.map(p => p.id === id ? {...p, ...updates} : p));
      
      toast({
        title: "Payment Recorded",
        description: "Payment has been successfully recorded.",
      });
      
      return data;
    } catch (err: any) {
      console.error('Error recording payment:', err);
      toast({
        variant: "destructive",
        title: "Error", 
        description: err.message || "Failed to record payment."
      });
      throw err;
    }
  };

  // Import payments
  const importPayments = async ({contractId, payments}: {contractId: string, payments: any[]}) => {
    try {
      if (!payments || !payments.length) {
        throw new Error('No payments provided for import');
      }
      
      // Prepare payments with contract id and default values
      const paymentsToInsert = payments.map(payment => ({
        contract_id: contractId,
        cheque_number: payment.cheque_number,
        drawee_bank: payment.drawee_bank,
        amount: payment.amount,
        payment_date: payment.payment_date,
        paid_amount: 0,
        remaining_amount: payment.amount,
        status: 'pending' as PaymentStatusType,
        notes: payment.notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        days_overdue: 0
      }));
      
      const { data, error } = await supabase
        .from('car_installment_payments')
        .insert(paymentsToInsert)
        .select();
      
      if (error) throw error;
      
      // Update state
      fetchPayments();
      
      toast({
        title: "Payments Imported",
        description: `${paymentsToInsert.length} payments imported successfully.`,
      });
      
      return data;
    } catch (err: any) {
      console.error('Error importing payments:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to import payments.",
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
      const { data, error } = await supabase
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
    isLoadingContracts,
    isLoadingSummary,
    error,
    summary,
    contractFilters,
    setContractFilters,
    paymentFilters,
    setPaymentFilters,
    fetchContracts,
    fetchPayments,
    fetchContractPayments,
    fetchPaymentsByStatus,
    createContract,
    updateContract,
    getContract,
    addPayment,
    recordPayment,
    importPayments,
    updatePaymentStatus
  };
};

export default useCarInstallments;
