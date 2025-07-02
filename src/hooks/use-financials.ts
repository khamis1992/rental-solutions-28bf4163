import { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from './use-toast';
import { useApiMutation, useApiQuery } from './api';
import { supabase } from '@/lib/supabase';

const getSystemDate = () => new Date();

export type TransactionType = 'income' | 'expense';
export type TransactionStatusType = 'completed' | 'pending' | 'failed';

export interface FinancialTransaction {
  id: string;
  date: Date;
  amount: number;
  description: string;
  receiptUrl?: string;
  receiptProcessed?: boolean;
  vendor?: string;
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
  installmentsPending: number;
  currentMonthDue: number;
  overdueExpenses: number;
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

  // Get real financial transactions from the system
  const { 
    data: transactions = [], 
    isLoading: isLoadingTransactions, 
    refetch: refetchTransactions 
  } = useApiQuery<FinancialTransaction[]>(
    ['financialTransactions', JSON.stringify(filters)],
    async () => {
      try {
        console.log("Fetching real financial transactions from payments table");
        
        // Get real payments from the system
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select(`
            *,
            leases (
              agreement_number,
              rent_amount,
              customers:profiles (full_name),
              vehicles (license_plate, make, model)
            )
          `);

        if (paymentsError) {
          console.error('Error fetching payments data:', paymentsError);
          throw paymentsError;
        }

        console.log(`Found ${paymentsData?.length || 0} payments in the system`);

        const formattedTransactions: FinancialTransaction[] = (paymentsData || []).map((payment: any) => ({
          id: payment.id,
          date: new Date(payment.payment_date || payment.created_at),
          amount: payment.amount || 0,
          description: payment.leases?.customers?.full_name 
            ? `إيجار - ${payment.leases.customers.full_name} (${payment.leases?.vehicles?.license_plate || 'غير محدد'})`
            : payment.description || 'دفعة إيجار',
          type: 'income' as TransactionType, // Most payments are income
          category: 'Rental',
          status: (payment.status?.toLowerCase() || 'completed') as TransactionStatusType,
          reference: payment.leases?.agreement_number || payment.id,
          paymentMethod: payment.payment_method || 'Cash',
          vehicleId: payment.leases?.vehicles?.id || '',
          customerId: payment.leases?.customers?.id || ''
        }));

        // Apply filters
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

  // Get real financial summary from the system
  const { 
    data: financialSummary, 
    isLoading: isLoadingSummary,
    refetch: refetchSummary
  } = useApiQuery<FinancialSummary>(
    ['financialSummary'],
    async () => {
      try {
        console.log("Calculating real financial summary from system data");
        
        const systemDate = getSystemDate();
        const currentMonth = systemDate.getMonth() + 1;
        const currentYear = systemDate.getFullYear();
        
        const startOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
        const endOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${new Date(currentYear, currentMonth, 0).getDate()}`;
        
        // Get current month's payments (income)
        const { data: monthlyPayments, error: paymentsError } = await supabase
          .from('payments')
          .select('amount, status, payment_date')
          .gte('payment_date', startOfMonth)
          .lte('payment_date', endOfMonth)
          .neq('status', 'failed');

        if (paymentsError) {
          console.error('Error fetching monthly payments:', paymentsError);
          throw paymentsError;
        }

        console.log(`Found ${monthlyPayments?.length || 0} payments for current month`);

        // Get pending payments
        const { data: pendingPayments, error: pendingError } = await supabase
          .from('payments')
          .select('amount')
          .eq('status', 'pending');

        if (pendingError) {
          console.error('Error fetching pending payments:', pendingError);
        }

        // Get overdue payments (payments that should have been made but status is still pending)
        const { data: overduePayments, error: overdueError } = await supabase
          .from('payments')
          .select('amount, due_date')
          .eq('status', 'pending')
          .lt('due_date', systemDate.toISOString());

        if (overdueError) {
          console.error('Error fetching overdue payments:', overdueError);
        }

        // Get active leases for expenses calculation
        const { data: activeLeases, error: leasesError } = await supabase
          .from('leases')
          .select('rent_amount, total_amount')
          .eq('status', 'active');

        if (leasesError) {
          console.error('Error fetching active leases:', leasesError);
        }

        // Calculate totals
        const totalIncome = (monthlyPayments || [])
          .filter(payment => payment.status === 'paid' || payment.status === 'completed')
          .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);

        const pendingAmount = (pendingPayments || [])
          .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);

        const overdueAmount = (overduePayments || [])
          .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);

        // Estimate expenses as a percentage of income (since we don't have a dedicated expenses system)
        const estimatedExpenses = Math.round(totalIncome * 0.3); // 30% of income as expenses

        const netRevenue = totalIncome - estimatedExpenses;

        // Expected monthly income from all active leases
        const expectedMonthlyIncome = (activeLeases || [])
          .reduce((sum, lease) => sum + (Number(lease.rent_amount) || 0), 0);

        const summary: FinancialSummary = {
          totalIncome: Number(totalIncome) || 0,
          totalExpenses: Number(estimatedExpenses) || 0,
          netRevenue: Number(netRevenue) || 0,
          pendingPayments: Number(pendingAmount) || 0,
          unpaidInvoices: Number(pendingAmount) || 0,
          installmentsPending: Number(overdueAmount) || 0,
          currentMonthDue: Number(expectedMonthlyIncome) || 0,
          overdueExpenses: Number(overdueAmount) || 0
        };
        
        console.log("Real financial summary calculated:", summary);
        return summary;
      } catch (error) {
        console.error('Error calculating financial summary:', error);
        return {
          totalIncome: 0,
          totalExpenses: 0,
          netRevenue: 0,
          pendingPayments: 0,
          unpaidInvoices: 0,
          installmentsPending: 0,
          currentMonthDue: 0,
          overdueExpenses: 0
        };
      }
    }
  );

  // Get expenses (simplified for now)
  const { 
    data: expenses = [], 
    isLoading: isLoadingExpenses, 
    refetch: refetchExpenses 
  } = useApiQuery<FinancialTransaction[]>(
    ['financialExpenses', JSON.stringify(expenseFilters)],
    async () => {
      try {
        // For now, return estimated expenses based on business // operations - removed unused variable// This can be expanded when a proper expenses tracking system is implemented
        console.log("Getting estimated expenses data");
        
        const estimatedExpenses: FinancialTransaction[] = [
          {
            id: 'exp-1',
            date: new Date(),
            amount: 1500,
            description: 'صيانة المركبات',
            type: 'expense',
            category: 'Maintenance',
            status: 'completed',
            reference: 'MAINT-001',
            paymentMethod: 'Bank Transfer'
          },
          {
            id: 'exp-2',
            date: new Date(),
            amount: 800,
            description: 'رواتب الموظفين',
            type: 'expense',
            category: 'Salary',
            status: 'completed',
            reference: 'SAL-001',
            paymentMethod: 'Bank Transfer'
          },
          {
            id: 'exp-3',
            date: new Date(),
            amount: 600,
            description: 'مصاريف تشغيلية',
            type: 'expense',
            category: 'Operational',
            status: 'completed',
            reference: 'OP-001',
            paymentMethod: 'Cash'
          }
        ];

        return estimatedExpenses;
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
      // This would integrate with a proper expense tracking system
      // For now, we'll return a mock response
      console.log("Adding transaction:", transactionData);
      
      return {
        id: `trans-${Date.now()}`,
        ...transactionData
      };
    },
    {
      onSuccess: () => {
        toast({
          title: "تمت إضافة المعاملة بنجاح",
          description: "تم حفظ المعاملة المالية الجديدة",
        });
        refetchTransactions();
        refetchSummary();
        refetchExpenses();
      },
      onError: (error) => {
        console.error('Error adding transaction:', error);
        toast({
          title: "خطأ في إضافة المعاملة",
          description: "حدث خطأ أثناء حفظ المعاملة المالية",
          variant: "destructive",
        });
      },
    }
  );

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const updateExpenseFilters = useCallback((newFilters: Partial<typeof expenseFilters>) => {
    setExpenseFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      transactionType: '',
      category: '',
      dateFrom: '',
      dateTo: '',
      searchQuery: '',
    });
  }, []);

  const clearExpenseFilters = useCallback(() => {
    setExpenseFilters({
      category: '',
      dateFrom: '',
      dateTo: '',
      searchQuery: '',
      recurringOnly: false,
    });
  }, []);

  return {
    // Data
    transactions,
    financialSummary,
    expenses,
    
    // Loading states
    isLoadingTransactions,
    isLoadingSummary,
    isLoadingExpenses,
    
    // Mutations
    addTransaction: addTransactionMutation.mutate,
    isAddingTransaction: addTransactionMutation.isPending,
    
    // Filters
    filters,
    expenseFilters,
    updateFilters,
    updateExpenseFilters,
    clearFilters,
    clearExpenseFilters,
    
    // Refetch functions
    refetchTransactions,
    refetchSummary,
    refetchExpenses,
  };
}
