
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { PaymentStatusType, ContractSummary, CarInstallmentContract, CarInstallmentPayment } from '@/types/car-installment';
import { toast } from 'sonner';

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
  
  const [contractFilters, setContractFilters] = useState({
    search: '',
    status: ''
  });
  
  const [paymentFilters, setPaymentFilters] = useState({
    status: '',
    dateRange: null
  });

  // Fetch all contracts
  const fetchContracts = useCallback(async () => {
    setIsLoadingContracts(true);
    setError(null);
    
    try {
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
      toast.error("Failed to fetch contracts. Please try again.");
    } finally {
      setIsLoadingContracts(false);
    }
  }, []);

  // Fetch all payments
  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
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
      toast.error("Failed to fetch payments. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch payments by status
  const fetchPaymentsByStatus = useCallback(async (status: PaymentStatusType) => {
    setIsLoading(true);
    setError(null);
    
    try {
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
      toast.error(`Failed to fetch ${status} payments.`);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      toast.error("Failed to calculate summary data.");
    } finally {
      setIsLoadingSummary(false);
    }
  }, [contracts.length]);

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

  // Fetch contract payments
  const fetchContractPayments = async (contractId: string, filters: any = {}) => {
    try {
      let query = supabase
        .from('car_installment_payments')
        .select('*')
        .eq('contract_id', contractId);
        
      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.dateRange?.from) {
        query = query.gte('payment_date', filters.dateRange.from);
      }

      if (filters.dateRange?.to) {
        query = query.lte('payment_date', filters.dateRange.to);
      }
      
      const { data, error } = await query.order('payment_date', { ascending: true });
      
      if (error) throw error;
      
      return data || [];
    } catch (err: any) {
      console.error('Error fetching contract payments:', err);
      toast.error("Failed to fetch payment data for this contract");
      return [];
    }
  };

  // Add new contract
  const createContract = async (contractData: Omit<CarInstallmentContract, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Calculate amount_pending based on total_contract_value
      const amount_pending = contractData.total_contract_value - (contractData.amount_paid || 0);
      
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
      
      toast.success("Contract added successfully");
      
      return data as CarInstallmentContract;
    } catch (err: any) {
      console.error('Error adding contract:', err);
      toast.error(err.message || "Failed to add contract.");
      throw err;
    }
  };

  // Add new payment
  const addPayment = async (paymentData: Omit<CarInstallmentPayment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Calculate remaining amount
      const remaining = paymentData.amount - (paymentData.paid_amount || 0);
      
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
      
      toast.success("Payment added successfully");
      
      return data as CarInstallmentPayment;
    } catch (err: any) {
      console.error('Error adding payment:', err);
      toast.error(err.message || "Failed to add payment.");
      throw err;
    }
  };

  // Record payment
  const recordPayment = async ({ id, amountPaid }: { id: string, amountPaid: number }) => {
    try {
      // First get the payment to update
      const { data: existingPayment, error: fetchError } = await supabase
        .from('car_installment_payments')
        .select('*')
        .eq('id', id)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Calculate new remaining amount
      const newRemainingAmount = Math.max(0, existingPayment.amount - amountPaid);
      const newStatus = newRemainingAmount === 0 ? 'paid' : 'pending';
      
      // Update the payment
      const { data, error } = await supabase
        .from('car_installment_payments')
        .update({
          paid_amount: amountPaid,
          remaining_amount: newRemainingAmount,
          status: newStatus,
          last_payment_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Update payments state
      setPayments(prev => prev.map(payment => 
        payment.id === id ? (data as CarInstallmentPayment) : payment
      ));
      
      // If payment is completed, update contract's amount_paid
      if (newStatus === 'paid' && existingPayment.contract_id) {
        // Fetch contract to update
        const { data: contractData, error: contractFetchError } = await supabase
          .from('car_installment_contracts')
          .select('*')
          .eq('id', existingPayment.contract_id)
          .single();
          
        if (contractFetchError) throw contractFetchError;
        
        // Update contract
        await supabase
          .from('car_installment_contracts')
          .update({
            amount_paid: (contractData.amount_paid || 0) + amountPaid,
            amount_pending: contractData.amount_pending - amountPaid,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPayment.contract_id);
          
        // Update contracts state
        setContracts(prev => prev.map(contract => 
          contract.id === existingPayment.contract_id ? {
            ...contract,
            amount_paid: (contract.amount_paid || 0) + amountPaid,
            amount_pending: contract.amount_pending - amountPaid
          } : contract
        ));
      }
      
      toast.success("Payment recorded successfully");
      
      return data as CarInstallmentPayment;
    } catch (err: any) {
      console.error('Error recording payment:', err);
      toast.error(err.message || "Failed to record payment");
      throw err;
    }
  };

  // Import payments
  const importPayments = async ({ contractId, payments }: { contractId: string, payments: any[] }) => {
    try {
      if (!payments || !payments.length) {
        toast.error("No payments to import");
        return;
      }
      
      // Format payments for insertion
      const formattedPayments = payments.map(payment => ({
        contract_id: contractId,
        cheque_number: payment.cheque_number,
        drawee_bank: payment.drawee_bank,
        amount: Number(payment.amount),
        payment_date: payment.payment_date,
        paid_amount: 0,
        remaining_amount: Number(payment.amount),
        status: 'pending',
        notes: payment.notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      // Insert all payments
      const { data, error } = await supabase
        .from('car_installment_payments')
        .insert(formattedPayments)
        .select();
        
      if (error) throw error;
      
      toast.success(`${payments.length} payments imported successfully`);
      
      // Update payments state
      if (Array.isArray(data)) {
        setPayments(prev => [...data as CarInstallmentPayment[], ...prev]);
      }
      
      return data;
    } catch (err: any) {
      console.error('Error importing payments:', err);
      toast.error(err.message || "Failed to import payments");
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
          const { error: contractError } = await supabase
            .from('car_installment_contracts')
            .update({
              amount_paid: (contract.amount_paid || 0) + data.paid_amount,
              updated_at: new Date().toISOString()
            })
            .eq('id', data.contract_id);
            
          if (!contractError) {
            setContracts(prev => 
              prev.map(c => c.id === data.contract_id ? {
                ...c,
                amount_paid: (c.amount_paid || 0) + data.paid_amount
              } : c)
            );
          }
        }
      }
      
      toast.success(`Payment status updated to ${status}`);
      
      return data as CarInstallmentPayment;
    } catch (err: any) {
      console.error('Error updating payment status:', err);
      toast.error(err.message || "Failed to update payment status");
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
    fetchPaymentsByStatus,
    fetchContractPayments,
    addPayment,
    recordPayment,
    importPayments,
    createContract,
    updatePaymentStatus
  };
};

export default useCarInstallments;
