import { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from './use-toast';
import { useApiMutation, useApiQuery } from './use-api';
import { supabase, checkAndGenerateMonthlyPayments } from '@/lib/supabase';

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
  isRecurring?: boolean;
  recurringInterval?: string;
  nextPaymentDate?: Date;
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

  const [expenseFilters, setExpenseFilters] = useState({
    category: '',
    dateFrom: '',
    dateTo: '',
    searchQuery: '',
    recurringOnly: false,
  });

  useEffect(() => {
    // Check for monthly payments without specific agreement
    checkAndGenerateMonthlyPayments().then((result) => {
      console.log("Monthly payment check completed:", result);
    });

    const today = SYSTEM_DATE.toDateString();
    const lastCheck = localStorage.getItem('lastPaymentCheck');
    
    if (!lastCheck || lastCheck !== today) {
      localStorage.setItem('lastPaymentCheck', today);
      
      // Run daily payment check for all agreements
      checkAndGenerateMonthlyPayments().then((result) => {
        console.log("Daily payment check completed:", result);
      });
    }
  }, []);

  const { 
    data: transactions = [], 
    isLoading: isLoadingTransactions, 
    refetch: refetchTransactions 
  } = useApiQuery<FinancialTransaction[]>(
    ['financialTransactions', JSON.stringify(filters)],
    async () => {
      try {
        const { data: paymentData, error: paymentError } = await supabase
          .from('unified_payments')
          .select('*');

        if (paymentError) {
          console.error('Error fetching payment data:', paymentError);
          throw paymentError;
        }

        const { data: installmentData, error: installmentError } = await supabase
          .from('car_installments')
          .select('*');

        if (installmentError) {
          console.error('Error fetching installment data:', installmentError);
          throw installmentError;
        }

        const formattedTransactions: FinancialTransaction[] = [
          ...(paymentData || []).map(payment => ({
            id: payment.id,
            date: new Date(payment.payment_date),
            amount: payment.amount || 0,
            description: payment.description || 'Rental Payment',
            type: payment.type?.toLowerCase() === 'expense' ? 'expense' : 'income' as TransactionType,
            category: payment.type === 'Expense' ? 'Operational' : 'Rental',
            status: payment.status?.toLowerCase() as TransactionStatusType || 'completed',
            reference: payment.reference || '',
            paymentMethod: payment.payment_method || 'Unknown',
            vehicleId: payment.vehicle_id || '',
            customerId: payment.customer_id || ''
          })),
          
          ...(installmentData || []).map(installment => ({
            id: `inst-${installment.id}`,
            date: new Date(installment.payment_date || SYSTEM_DATE),
            amount: installment.payment_amount || 0,
            description: `Car Installment - ${installment.vehicle_description || 'Vehicle'}`,
            type: 'expense' as TransactionType,
            category: 'Installment',
            status: installment.payment_status?.toLowerCase() as TransactionStatusType || 'completed',
            reference: installment.reference || '',
            paymentMethod: installment.payment_method || 'Bank Transfer',
            vehicleId: installment.vehicle_id || ''
          }))
        ];

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
        
        return filtered;
      } catch (error) {
        console.error('Error fetching financial transactions:', error);
        return [];
      }
    }
  );

  const { 
    data: financialSummary, 
    isLoading: isLoadingSummary,
    refetch: refetchSummary
  } = useApiQuery<FinancialSummary>(
    ['financialSummary'],
    async () => {
      try {
        const { data: incomeData, error: incomeError } = await supabase
          .from('unified_payments')
          .select('amount, status')
          .eq('type', 'Income');

        if (incomeError) {
          console.error('Error fetching income data:', incomeError);
          throw incomeError;
        }

        const { data: expenseData, error: expenseError } = await supabase
          .from('unified_payments')
          .select('amount, status')
          .eq('type', 'Expense');

        if (expenseError) {
          console.error('Error fetching expense data:', expenseError);
          throw expenseError;
        }

        const { data: installmentData, error: installmentError } = await supabase
          .from('car_installments')
          .select('payment_amount, payment_status');

        if (installmentError) {
          console.error('Error fetching installment data:', installmentError);
          throw installmentError;
        }

        const totalIncome = (incomeData || [])
          .filter(item => item.status !== 'failed')
          .reduce((sum, item) => sum + (item.amount || 0), 0);
          
        const expensesFromPayments = (expenseData || [])
          .filter(item => item.status !== 'failed')
          .reduce((sum, item) => sum + (item.amount || 0), 0);
          
        const expensesFromInstallments = (installmentData || [])
          .filter(item => item.payment_status !== 'failed')
          .reduce((sum, item) => sum + (item.payment_amount || 0), 0);
          
        const totalExpenses = expensesFromPayments + expensesFromInstallments;
        
        const pendingPayments = (incomeData || [])
          .filter(item => item.status === 'pending')
          .reduce((sum, item) => sum + (item.amount || 0), 0);

        return {
          totalIncome,
          totalExpenses,
          netRevenue: totalIncome - totalExpenses,
          pendingPayments,
          unpaidInvoices: pendingPayments
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

  const { 
    data: expenses = [], 
    isLoading: isLoadingExpenses, 
    refetch: refetchExpenses 
  } = useApiQuery<FinancialTransaction[]>(
    ['financialExpenses', JSON.stringify(expenseFilters)],
    async () => {
      try {
        const { data: expenseData, error: expenseError } = await supabase
          .from('unified_payments')
          .select('*')
          .eq('type', 'Expense');

        if (expenseError) {
          console.error('Error fetching expense data:', expenseError);
          throw expenseError;
        }

        const formattedExpenses: FinancialTransaction[] = (expenseData || []).map(expense => ({
          id: expense.id,
          date: new Date(expense.payment_date || expense.created_at),
          amount: expense.amount || 0,
          description: expense.description || 'Expense',
          type: 'expense' as TransactionType,
          category: expense.description?.includes('Salary') ? 'Salary' : 
                   expense.description?.includes('Rent') ? 'Rent' : 
                   expense.description?.includes('Utility') ? 'Utilities' : 'Other',
          status: expense.status?.toLowerCase() as TransactionStatusType || 'completed',
          reference: expense.reference || '',
          paymentMethod: expense.payment_method || 'Cash',
          isRecurring: expense.is_recurring || false,
          recurringInterval: expense.recurring_interval || undefined,
          nextPaymentDate: expense.next_payment_date ? new Date(expense.next_payment_date) : undefined
        }));

        let filtered = formattedExpenses;
        
        if (expenseFilters.category && expenseFilters.category !== 'all_categories') {
          filtered = filtered.filter(e => e.category === expenseFilters.category);
        }
        
        if (expenseFilters.dateFrom) {
          filtered = filtered.filter(e => e.date >= new Date(expenseFilters.dateFrom));
        }
        
        if (expenseFilters.dateTo) {
          filtered = filtered.filter(e => e.date <= new Date(expenseFilters.dateTo));
        }
        
        if (expenseFilters.searchQuery) {
          const query = expenseFilters.searchQuery.toLowerCase();
          filtered = filtered.filter(e => 
            e.description.toLowerCase().includes(query) ||
            e.category.toLowerCase().includes(query)
          );
        }
        
        if (expenseFilters.recurringOnly) {
          filtered = filtered.filter(e => e.isRecurring === true);
        }
        
        return filtered;
      } catch (error) {
        console.error('Error fetching expenses:', error);
        return [];
      }
    }
  );

  const addTransactionMutation = useApiMutation<
    FinancialTransaction,
    Omit<FinancialTransaction, 'id'>
  >(
    async (transactionData) => {
      const { data, error } = await supabase
        .from('unified_payments')
        .insert({
          payment_date: transactionData.date.toISOString(),
          amount: transactionData.amount,
          description: transactionData.description,
          type: transactionData.type === 'income' ? 'Income' : 'Expense',
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

      return {
        id: data.id,
        date: new Date(data.payment_date),
        amount: data.amount,
        description: data.description,
        type: data.type?.toLowerCase() === 'expense' ? 'expense' : 'income',
        category: data.type === 'Expense' ? 
                 data.description?.includes('Salary') ? 'Salary' : 
                 data.description?.includes('Rent') ? 'Rent' : 
                 data.description?.includes('Utility') ? 'Utilities' : 'Other' : 'Rental',
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

  const updateTransactionMutation = useApiMutation<
    FinancialTransaction,
    { id: string; data: Partial<FinancialTransaction> }
  >(
    async ({ id, data }) => {
      if (typeof id === 'string' && id.startsWith('inst-')) {
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
        const { data: updatedData, error } = await supabase
          .from('unified_payments')
          .update({
            payment_date: data.date?.toISOString(),
            amount: data.amount,
            description: data.description,
            type: data.type === 'income' ? 'Income' : 'Expense',
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
          category: updatedData.type === 'Expense' ? 
                   updatedData.description?.includes('Salary') ? 'Salary' : 
                   updatedData.description?.includes('Rent') ? 'Rent' : 
                   updatedData.description?.includes('Utility') ? 'Utilities' : 'Other' : 'Rental',
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

  const deleteTransactionMutation = useApiMutation<
    string,
    string
  >(
    async (id) => {
      if (typeof id === 'string' && id.startsWith('inst-')) {
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

  const addExpenseMutation = useApiMutation<
    FinancialTransaction,
    Omit<FinancialTransaction, 'id'>
  >(
    async (expenseData) => {
      const nextPaymentDate = expenseData.nextPaymentDate
        ? expenseData.nextPaymentDate.toISOString()
        : null;

      const { data, error } = await supabase
        .from('unified_payments')
        .insert({
          payment_date: expenseData.date.toISOString(),
          amount: expenseData.amount,
          description: expenseData.description,
          type: 'Expense',
          status: expenseData.status,
          reference: expenseData.reference,
          payment_method: expenseData.paymentMethod,
          is_recurring: expenseData.isRecurring || false,
          recurring_interval: expenseData.recurringInterval,
          next_payment_date: nextPaymentDate
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding expense:', error);
        throw error;
      }

      return {
        id: data.id,
        date: new Date(data.payment_date),
        amount: data.amount,
        description: data.description,
        type: 'expense',
        category: data.description?.includes('Salary') ? 'Salary' : 
                 data.description?.includes('Rent') ? 'Rent' : 
                 data.description?.includes('Utility') ? 'Utilities' : 'Other',
        status: data.status as TransactionStatusType,
        reference: data.reference,
        paymentMethod: data.payment_method,
        isRecurring: data.is_recurring || false,
        recurringInterval: data.recurring_interval,
        nextPaymentDate: data.next_payment_date ? new Date(data.next_payment_date) : undefined
      };
    },
    {
      onSuccess: () => {
        toast({
          title: 'Expense added',
          description: 'Expense has been added successfully.'
        });
        refetchExpenses();
        refetchSummary();
      }
    }
  );

  const updateExpenseMutation = useApiMutation<
    FinancialTransaction,
    { id: string; data: Partial<FinancialTransaction> }
  >(
    async ({ id, data }) => {
      const updateData: any = {};
      
      if (data.date) updateData.payment_date = data.date.toISOString();
      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.description) updateData.description = data.description;
      if (data.status) updateData.status = data.status;
      if (data.reference !== undefined) updateData.reference = data.reference;
      if (data.paymentMethod) updateData.payment_method = data.paymentMethod;
      if (data.isRecurring !== undefined) updateData.is_recurring = data.isRecurring;
      if (data.recurringInterval) updateData.recurring_interval = data.recurringInterval;
      if (data.nextPaymentDate) updateData.next_payment_date = data.nextPaymentDate.toISOString();
      
      if (data.isRecurring === false) {
        updateData.recurring_interval = null;
        updateData.next_payment_date = null;
      }

      const { data: updatedData, error } = await supabase
        .from('unified_payments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating expense:', error);
        throw error;
      }

      return {
        id: updatedData.id,
        date: new Date(updatedData.payment_date),
        amount: updatedData.amount,
        description: updatedData.description,
        type: 'expense',
        category: updatedData.description?.includes('Salary') ? 'Salary' : 
                 updatedData.description?.includes('Rent') ? 'Rent' : 
                 updatedData.description?.includes('Utility') ? 'Utilities' : 'Other',
        status: updatedData.status as TransactionStatusType,
        reference: updatedData.reference,
        paymentMethod: updatedData.payment_method,
        isRecurring: updatedData.is_recurring || false,
        recurringInterval: updatedData.recurring_interval,
        nextPaymentDate: updatedData.next_payment_date ? new Date(updatedData.next_payment_date) : undefined
      };
    },
    {
      onSuccess: () => {
        toast({
          title: 'Expense updated',
          description: 'Expense has been updated successfully.'
        });
        refetchExpenses();
        refetchSummary();
      }
    }
  );

  const deleteExpenseMutation = useApiMutation<
    string,
    string
  >(
    async (id) => {
      const { error } = await supabase
        .from('unified_payments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting expense:', error);
        throw error;
      }
      
      return id;
    },
    {
      onSuccess: () => {
        toast({
          title: 'Expense deleted',
          description: 'Expense has been deleted successfully.'
        });
        refetchExpenses();
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
    expenses,
    isLoadingExpenses,
    expenseFilters,
    setExpenseFilters,
    addExpense: addExpenseMutation.mutate,
    updateExpense: updateExpenseMutation.mutate,
    deleteExpense: deleteExpenseMutation.mutate,
    recurringExpenses: expenses.filter(e => e.isRecurring === true),
    systemDate: SYSTEM_DATE
  };
}
