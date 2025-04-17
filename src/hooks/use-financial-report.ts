
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface FinancialItem {
  id: string;
  amount: number;
  date: string;
  category: string;
  description?: string;
}

interface FinancialReport {
  revenue: FinancialItem[];
  expenses: FinancialItem[];
}

export function useFinancialReport() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['financial-report'],
    queryFn: async (): Promise<FinancialReport> => {
      try {
        // Fetch revenue
        const { data: revenue, error: revenueError } = await supabase
          .from('transaction_amounts')
          .select('*')
          .eq('type', 'income');
          
        if (revenueError) throw revenueError;
          
        // Fetch expenses
        const { data: expenses, error: expensesError } = await supabase
          .from('transaction_amounts')
          .select('*')
          .eq('type', 'expense');
            
        if (expensesError) throw expensesError;
          
        // Map the data to our interface
        const mappedRevenue = (revenue || []).map(item => ({
          id: item.id,
          amount: Number(item.amount) || 0,
          date: item.recorded_date || new Date().toISOString(),
          category: item.category || 'Uncategorized',
          description: item.transaction_reference
        }));
          
        const mappedExpenses = (expenses || []).map(item => ({
          id: item.id,
          amount: Number(item.amount) || 0,
          date: item.recorded_date || new Date().toISOString(),
          category: item.category || 'Uncategorized',
          description: item.transaction_reference
        }));
          
        return {
          revenue: mappedRevenue,
          expenses: mappedExpenses
        };
      } catch (error) {
        console.error('Error fetching financial data:', error);
        // Return empty data on error
        return { revenue: [], expenses: [] };
      }
    }
  });

  return data || { revenue: [], expenses: [] };
}
