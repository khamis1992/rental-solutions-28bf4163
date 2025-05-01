
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { FinancialTransaction, FinancialSummary } from '@/types/financial-types';

export { FinancialTransaction, FinancialSummary };

// Fetch financial data (payments, expenses, etc.)
const fetchFinancialData = async () => {
  const { data, error } = await supabase
    .from('unified_payments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

// Calculate financial summary
const calculateFinancialSummary = (transactions: any[]): FinancialSummary => {
  const totalIncome = transactions
    .filter(t => t.type === 'income' && t.status === 'completed')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense' && t.status === 'completed')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  
  const pendingIncome = transactions
    .filter(t => t.type === 'income' && t.status === 'pending')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  
  const pendingExpenses = transactions
    .filter(t => t.type === 'expense' && t.status === 'pending')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Get top categories
  const categories: Record<string, number> = {};
  transactions.forEach(t => {
    const category = t.category || 'Uncategorized';
    if (!categories[category]) categories[category] = 0;
    categories[category] += (t.amount || 0);
  });

  const topCategories = Object.entries(categories)
    .map(([name, amount]) => ({ 
      name, 
      amount, 
      percentage: Math.round((amount / (totalIncome + totalExpenses)) * 100) 
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Create monthly data
  const monthlyData = [
    { month: 'Jan', income: 0, expenses: 0 },
    { month: 'Feb', income: 0, expenses: 0 },
    { month: 'Mar', income: 0, expenses: 0 },
    { month: 'Apr', income: 0, expenses: 0 },
    { month: 'May', income: 0, expenses: 0 },
    { month: 'Jun', income: 0, expenses: 0 },
    { month: 'Jul', income: 0, expenses: 0 },
    { month: 'Aug', income: 0, expenses: 0 },
    { month: 'Sep', income: 0, expenses: 0 },
    { month: 'Oct', income: 0, expenses: 0 },
    { month: 'Nov', income: 0, expenses: 0 },
    { month: 'Dec', income: 0, expenses: 0 }
  ];

  // For demo purposes, add some random data
  monthlyData.forEach(month => {
    month.income = Math.random() * 10000;
    month.expenses = Math.random() * 8000;
  });

  return {
    totalIncome,
    totalExpenses,
    netProfit: totalIncome - totalExpenses,
    pendingIncome,
    pendingExpenses,
    recentTransactions: transactions.slice(0, 5) as FinancialTransaction[],
    topCategories,
    monthlyData
  };
};

// Hook for financial data and operations
export const useFinancials = () => {
  const queryClient = useQueryClient();

  const { data: financialData = [], isLoading } = useQuery({
    queryKey: ['financialData'],
    queryFn: fetchFinancialData
  });

  const { data: financialSummary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['financialSummary'],
    queryFn: () => calculateFinancialSummary(financialData),
    enabled: financialData.length > 0
  });

  // Create a transaction (payment or expense)
  const createTransaction = useMutation({
    mutationFn: async (transaction: Partial<FinancialTransaction>) => {
      const { data, error } = await supabase
        .from('unified_payments')
        .insert([{
          ...transaction,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select('*');

      if (error) throw new Error(error.message);
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialData'] });
      toast.success('Transaction created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create transaction: ${(error as Error).message}`);
    }
  });

  // Update a transaction
  const updateTransaction = useMutation({
    mutationFn: async ({ id, ...transaction }: Partial<FinancialTransaction> & { id: string }) => {
      const { data, error } = await supabase
        .from('unified_payments')
        .update({
          ...transaction,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*');

      if (error) throw new Error(error.message);
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialData'] });
      toast.success('Transaction updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update transaction: ${(error as Error).message}`);
    }
  });

  // Delete a transaction
  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('unified_payments')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialData'] });
      toast.success('Transaction deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete transaction: ${(error as Error).message}`);
    }
  });

  return {
    financialData,
    financialSummary,
    isLoading,
    isLoadingSummary,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    isCreatingTransaction: createTransaction.isPending,
    isUpdatingTransaction: updateTransaction.isPending,
    isDeletingTransaction: deleteTransaction.isPending
  };
};
