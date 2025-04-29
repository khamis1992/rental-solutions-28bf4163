import { useApiQuery } from './use-api';
import { FinancialTransaction } from './financials-types';
import { fetchFinancialTransactions } from './financials-utils';
import { useToast } from './use-toast';

export function useFinancialTransactions(filters: Record<string, any>) {
  const { toast } = useToast();

  return useApiQuery<FinancialTransaction[]>(
    ['financialTransactions', JSON.stringify(filters)],
    async () => {
      try {
        return await fetchFinancialTransactions(filters);
      } catch (error: any) {
        toast({
          title: 'Error fetching transactions',
          description: error?.message || 'An unknown error occurred.',
          variant: 'destructive',
        });
        return [];
      }
    }
  );
}
