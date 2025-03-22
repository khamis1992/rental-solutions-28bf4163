
import { useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { useApiMutation, useApiQuery } from './use-api';
import { supabase, checkAndGenerateMonthlyPayments, forceCheckAllAgreementsForPayments } from '@/lib/supabase';

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
    // Check for monthly payments once a day
    const checkDate = localStorage.getItem('lastPaymentCheck');
    const today = new Date().toDateString();
    
    if (!checkDate || checkDate !== today) {
      checkAndGenerateMonthlyPayments().then((result) => {
        localStorage.setItem('lastPaymentCheck', today);
        console.log("Monthly payment check completed:", result);
      });
    }
  }, []);

  // Financial transactions query
  const { 
    data: transactions = [], 
    isLoading: isLoadingTransactions, 
    refetch: refetchTransactions 
  } = useApiQuery<FinancialTransaction[]>(
    ['financialTransactions', JSON.stringify(filters)],
    async () => {
      // Mock data for demonstration
      return [
        {
          id: '1',
          date: new Date(),
          amount: 5000,
          description: 'Vehicle rental payment',
          type: 'income',
          category: 'Rental',
          status: 'completed',
          paymentMethod: 'Credit Card',
          reference: 'REF123456'
        },
        {
          id: '2',
          date: new Date(),
          amount: 1200,
          description: 'Vehicle maintenance',
          type: 'expense',
          category: 'Maintenance',
          status: 'completed',
          paymentMethod: 'Bank Transfer'
        },
        {
          id: '3',
          date: new Date(),
          amount: 3500,
          description: 'Vehicle rental payment',
          type: 'income',
          category: 'Rental',
          status: 'pending',
          paymentMethod: 'Cash'
        }
      ] as FinancialTransaction[];
    }
  );

  // Financial summary query
  const { 
    data: financialSummary, 
    isLoading: isLoadingSummary 
  } = useApiQuery<FinancialSummary>(
    ['financialSummary'],
    async () => {
      // Mock data for demonstration
      return {
        totalIncome: 8500,
        totalExpenses: 1200,
        netRevenue: 7300,
        pendingPayments: 3500,
        unpaidInvoices: 0
      };
    }
  );

  // Add transaction mutation
  const addTransactionMutation = useApiMutation<
    FinancialTransaction,
    unknown,
    Omit<FinancialTransaction, 'id'>
  >(
    async (transactionData) => {
      // In a real implementation, this would be an API call
      return {
        id: Math.random().toString(36).substr(2, 9),
        ...transactionData
      } as FinancialTransaction;
    },
    {
      onSuccess: () => {
        toast({
          title: 'Transaction added',
          description: 'Financial transaction has been added successfully.'
        });
        refetchTransactions();
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
      // In a real implementation, this would be an API call
      return { id, ...data } as FinancialTransaction;
    },
    {
      onSuccess: () => {
        toast({
          title: 'Transaction updated',
          description: 'Financial transaction has been updated successfully.'
        });
        refetchTransactions();
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
      // In a real implementation, this would be an API call
      return id;
    },
    {
      onSuccess: () => {
        toast({
          title: 'Transaction deleted',
          description: 'Financial transaction has been deleted successfully.'
        });
        refetchTransactions();
      }
    }
  );

  // Generate monthly payments function
  const generateMonthlyPayments = async () => {
    try {
      toast({
        title: 'Generating monthly payments',
        description: 'Please wait while we generate pending payments for active agreements.'
      });
      
      const result = await forceCheckAllAgreementsForPayments();
      
      if (result.success) {
        toast({
          title: 'Monthly payments generated',
          description: `System has generated ${result.generated} pending payments for ${result.checked} active agreements.`
        });
      } else {
        toast({
          title: 'Payment generation complete',
          description: 'No new payments needed to be generated at this time.'
        });
      }
      
      return result;
    } catch (error) {
      console.error("Error generating payments:", error);
      toast({
        title: 'Payment generation failed',
        description: 'There was an error generating monthly payments.',
        variant: 'destructive'
      });
      return { success: false, error };
    }
  };

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
    generateMonthlyPayments
  };
}
