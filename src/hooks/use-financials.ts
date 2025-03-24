
import { useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { useApiMutation, useApiQuery } from './use-api';
import { supabase, checkAndGenerateMonthlyPayments } from '@/lib/supabase';

// Define the current system date as March 24, 2025
const SYSTEM_DATE = new Date(2025, 2, 24);

export type TransactionType = 'income' | 'expense';
export type TransactionStatusType = 'completed' | 'pending' | 'failed';

export interface FinancialTransaction {
  id: string;
  date: Date;
  amount: number;
  description: string;
  type: TransactionType;
  category: string;
  status: TransactionStatusType;
  reference?: string;
  paymentMethod?: string;
  vehicleId?: string;
  customerId?: string;
  attachmentUrl?: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netRevenue: number;
  pendingPayments: number;
  unpaidInvoices: number;
}

export function useFinancials() {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    transactionType: '',
    category: '',
    dateFrom: '',
    dateTo: '',
    searchQuery: '',
  });

  // Initialize system checks on mount
  useEffect(() => {
    // Check for monthly payments on each hook instantiation
    checkAndGenerateMonthlyPayments().then((result) => {
      console.log("Monthly payment check completed:", result);
    });
    
    // Set up a check that runs once per day
    const today = SYSTEM_DATE.toDateString();
    const lastCheck = localStorage.getItem('lastPaymentCheck');
    
    if (!lastCheck || lastCheck !== today) {
      localStorage.setItem('lastPaymentCheck', today);
      
      // Check again just to be sure
      checkAndGenerateMonthlyPayments().then((result) => {
        console.log("Daily payment check completed:", result);
      });
    }
  }, []);

  // Financial transactions query - now fetching real data from Supabase
  const { 
    data: transactions = [], 
    isLoading: isLoadingTransactions, 
    refetch: refetchTransactions 
  } = useApiQuery<FinancialTransaction[]>(
    ['financialTransactions', JSON.stringify(filters)],
    async () => {
      try {
        // Fetch actual transactions from unified_payments table
        const { data: paymentData, error: paymentError } = await supabase
          .from('unified_payments')
          .select('*');

        if (paymentError) {
          console.error('Error fetching payment data:', paymentError);
          throw paymentError;
        }

        // Fetch car installment data for expenses
        const { data: installmentData, error: installmentError } = await supabase
          .from('car_installments')
          .select('*');

        if (installmentError) {
          console.error('Error fetching installment data:', installmentError);
          throw installmentError;
        }

        // Combine and format all financial transactions
        const formattedTransactions: FinancialTransaction[] = [
          // Map payment data (primarily income from rentals)
          ...(paymentData || []).map(payment => ({
            id: payment.id,
            date: new Date(payment.payment_date),
            amount: payment.amount || 0,
            description: payment.description || 'Rental Payment',
            type: payment.type?.toLowerCase() === 'expense' ? 'expense' : 'income',
            category: payment.type === 'Expense' ? 'Operational' : 'Rental',
            status: payment.status?.toLowerCase() as TransactionStatusType || 'completed',
            reference: payment.reference || '',
            paymentMethod: payment.payment_method || 'Unknown',
            vehicleId: payment.vehicle_id || '',
            customerId: payment.customer_id || ''
          })),
          
          // Map installment data (expenses for car payments)
          ...(installmentData || []).map(installment => ({
            id: `inst-${installment.id}`,
            date: new Date(installment.payment_date || SYSTEM_DATE),
            amount: installment.payment_amount || 0,
            description: `Car Installment - ${installment.vehicle_description || 'Vehicle'}`,
            type: 'expense',
            category: 'Installment',
            status: installment.payment_status?.toLowerCase() as TransactionStatusType || 'completed',
            reference: installment.reference || '',
            paymentMethod: installment.payment_method || 'Bank Transfer',
            vehicleId: installment.vehicle_id || ''
          }))
        ];

        // Filter transactions based on applied filters
        let filtered = formattedTransactions;
        
        if (filters.transactionType && filters.transactionType !== 'all_types') {
          filtered = filtered.filter(t => t.type === filters.transactionType);
        }
        
        if (filters.category && filters.category !== 'all_categories') {
          filtered = filtered.filter(t => t.category === filters.category);
        }
        
        if (filters.dateFrom) {
          filtered = filtered.filter(t => t.date >= new Date(filters.dateFrom));
        }
        
        if (filters.dateTo) {
          filtered = filtered.filter(t => t.date <= new Date(filters.dateTo));
        }
        
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          filtered = filtered.filter(t => 
            t.description.toLowerCase().includes(query) ||
            t.category.toLowerCase().includes(query)
          );
        }
        
        // Return filtered transactions for UI display
        return filtered;
      } catch (error) {
        console.error('Error fetching financial transactions:', error);
        return [];
      }
    }
  );

  // Financial summary query - calculated from real transaction data
  const { 
    data: financialSummary, 
    isLoading: isLoadingSummary,
    refetch: refetchSummary
  } = useApiQuery<FinancialSummary>(
    ['financialSummary'],
    async () => {
      try {
        // Fetch rental income data - all unified_payments of type Income
        const { data: incomeData, error: incomeError } = await supabase
          .from('unified_payments')
          .select('amount, status')
          .eq('type', 'Income');

        if (incomeError) {
          console.error('Error fetching income data:', incomeError);
          throw incomeError;
        }

        // Fetch expense data - all unified_payments of type Expense
        const { data: expenseData, error: expenseError } = await supabase
          .from('unified_payments')
          .select('amount, status')
          .eq('type', 'Expense');

        if (expenseError) {
          console.error('Error fetching expense data:', expenseError);
          throw expenseError;
        }

        // Fetch car installment expenses
        const { data: installmentData, error: installmentError } = await supabase
          .from('car_installments')
          .select('payment_amount, payment_status');

        if (installmentError) {
          console.error('Error fetching installment data:', installmentError);
          throw installmentError;
        }

        // Calculate totals from real data
        const totalIncome = (incomeData || [])
          .filter(item => item.status !== 'failed')
          .reduce((sum, item) => sum + (item.amount || 0), 0);
          
        // Combine expenses from both sources
        const expensesFromPayments = (expenseData || [])
          .filter(item => item.status !== 'failed')
          .reduce((sum, item) => sum + (item.amount || 0), 0);
          
        const expensesFromInstallments = (installmentData || [])
          .filter(item => item.payment_status !== 'failed')
          .reduce((sum, item) => sum + (item.payment_amount || 0), 0);
          
        const totalExpenses = expensesFromPayments + expensesFromInstallments;
        
        // Calculate pending payments (income items with status 'pending')
        const pendingPayments = (incomeData || [])
          .filter(item => item.status === 'pending')
          .reduce((sum, item) => sum + (item.amount || 0), 0);

        // Return the financial summary 
        return {
          totalIncome,
          totalExpenses,
          netRevenue: totalIncome - totalExpenses,
          pendingPayments,
          unpaidInvoices: pendingPayments // Same as pending payments for now
        };
      } catch (error) {
        console.error('Error calculating financial summary:', error);
        return {
          totalIncome: 0,
          totalExpenses: 0,
          netRevenue: 0,
          pendingPayments: 0,
          unpaidInvoices: 0
        };
      }
    }
  );

  // Add transaction mutation
  const addTransactionMutation = useApiMutation<
    FinancialTransaction,
    unknown,
    Omit<FinancialTransaction, 'id'>
  >(
    async (transactionData) => {
      // Insert new transaction into unified_payments table
      const { data, error } = await supabase
        .from('unified_payments')
        .insert({
          payment_date: transactionData.date.toISOString(),
          amount: transactionData.amount,
          description: transactionData.description,
          type: transactionData.type === 'income' ? 'Income' : 'Expense',
          category: transactionData.category,
          status: transactionData.status,
          reference: transactionData.reference,
          payment_method: transactionData.paymentMethod,
          vehicle_id: transactionData.vehicleId,
          customer_id: transactionData.customerId
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding transaction:', error);
        throw error;
      }

      // Format returned data to match our component expectations
      return {
        id: data.id,
        date: new Date(data.payment_date),
        amount: data.amount,
        description: data.description,
        type: data.type?.toLowerCase() === 'expense' ? 'expense' : 'income',
        category: data.category || '',
        status: data.status as TransactionStatusType,
        reference: data.reference,
        paymentMethod: data.payment_method,
        vehicleId: data.vehicle_id,
        customerId: data.customer_id
      };
    },
    {
      onSuccess: () => {
        toast({
          title: 'Transaction added',
          description: 'Financial transaction has been added successfully.'
        });
        refetchTransactions();
        refetchSummary();
      }
    }
  );

  // Update transaction mutation
  const updateTransactionMutation = useApiMutation<
    FinancialTransaction,
    unknown,
    { id: string; data: Partial<FinancialTransaction> }
  >(
    async ({ id, data }) => {
      if (id.startsWith('inst-')) {
        // Handle installment update
        const actualId = id.replace('inst-', '');
        const { data: updatedData, error } = await supabase
          .from('car_installments')
          .update({
            payment_amount: data.amount,
            payment_date: data.date?.toISOString(),
            payment_status: data.status,
            vehicle_description: data.description,
            payment_method: data.paymentMethod,
            reference: data.reference,
            vehicle_id: data.vehicleId
          })
          .eq('id', actualId)
          .select()
          .single();

        if (error) {
          console.error('Error updating installment:', error);
          throw error;
        }

        return {
          id: `inst-${updatedData.id}`,
          date: new Date(updatedData.payment_date),
          amount: updatedData.payment_amount,
          description: updatedData.vehicle_description,
          type: 'expense',
          category: 'Installment',
          status: updatedData.payment_status as TransactionStatusType,
          reference: updatedData.reference,
          paymentMethod: updatedData.payment_method,
          vehicleId: updatedData.vehicle_id
        };
      } else {
        // Handle regular transaction update
        const { data: updatedData, error } = await supabase
          .from('unified_payments')
          .update({
            payment_date: data.date?.toISOString(),
            amount: data.amount,
            description: data.description,
            type: data.type === 'income' ? 'Income' : 'Expense',
            category: data.category,
            status: data.status,
            reference: data.reference,
            payment_method: data.paymentMethod,
            vehicle_id: data.vehicleId,
            customer_id: data.customerId
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Error updating transaction:', error);
          throw error;
        }

        return {
          id: updatedData.id,
          date: new Date(updatedData.payment_date),
          amount: updatedData.amount,
          description: updatedData.description,
          type: updatedData.type?.toLowerCase() === 'expense' ? 'expense' : 'income',
          category: updatedData.category || '',
          status: updatedData.status as TransactionStatusType,
          reference: updatedData.reference,
          paymentMethod: updatedData.payment_method,
          vehicleId: updatedData.vehicle_id,
          customerId: updatedData.customer_id
        };
      }
    },
    {
      onSuccess: () => {
        toast({
          title: 'Transaction updated',
          description: 'Financial transaction has been updated successfully.'
        });
        refetchTransactions();
        refetchSummary();
      }
    }
  );

  // Delete transaction mutation
  const deleteTransactionMutation = useApiMutation<
    string,
    unknown,
    string
  >(
    async (id) => {
      if (id.startsWith('inst-')) {
        // Handle installment deletion
        const actualId = id.replace('inst-', '');
        const { error } = await supabase
          .from('car_installments')
          .delete()
          .eq('id', actualId);

        if (error) {
          console.error('Error deleting installment:', error);
          throw error;
        }
      } else {
        // Handle regular transaction deletion
        const { error } = await supabase
          .from('unified_payments')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting transaction:', error);
          throw error;
        }
      }
      return id;
    },
    {
      onSuccess: () => {
        toast({
          title: 'Transaction deleted',
          description: 'Financial transaction has been deleted successfully.'
        });
        refetchTransactions();
        refetchSummary();
      }
    }
  );

  return {
    transactions,
    isLoadingTransactions,
    financialSummary,
    isLoadingSummary,
    filters,
    setFilters,
    addTransaction: addTransactionMutation.mutate,
    updateTransaction: updateTransactionMutation.mutate,
    deleteTransaction: deleteTransactionMutation.mutate,
    systemDate: SYSTEM_DATE
  };
}
