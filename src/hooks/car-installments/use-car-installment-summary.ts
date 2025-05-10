
// Hook for fetching summary data about car installment contracts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ContractSummary } from '@/types/car-installment';
import { UseCarInstallmentSummaryResult } from './types';

export function useCarInstallmentSummary(): UseCarInstallmentSummaryResult {
  // Query summary
  const {
    data: summary = { totalContracts: 0, totalPortfolioValue: 0, totalCollections: 0, upcomingPayments: 0 },
    isLoading: isLoadingSummary
  } = useQuery({
    queryKey: ['car-installment-summary'],
    queryFn: async () => {
      try {
        // Get count of contracts
        const { count: totalContracts } = await supabase
          .from('car_installment_contracts')
          .select('*', { count: 'exact', head: true });
        
        // Get total portfolio value and amount paid
        const { data: totalsData } = await supabase
          .from('car_installment_contracts')
          .select('total_contract_value, amount_paid')
          .or('total_contract_value.gte.0,amount_paid.gte.0');
          
        // Calculate totals from the returned data
        let totalPortfolioValue = 0;
        let totalCollections = 0;
        
        if (totalsData && totalsData.length > 0) {
          totalPortfolioValue = totalsData.reduce((sum, item) => 
            sum + (typeof item.total_contract_value === 'number' ? item.total_contract_value : 0), 0);
          
          totalCollections = totalsData.reduce((sum, item) => 
            sum + (typeof item.amount_paid === 'number' ? item.amount_paid : 0), 0);
        }
        
        // Get upcoming payments
        const { data: upcomingData } = await supabase
          .from('car_installment_payments')
          .select('amount')
          .eq('status', 'pending');
        
        const upcomingPayments = upcomingData ? 
          upcomingData.reduce((sum, item) => sum + (item.amount || 0), 0) : 0;
        
        return {
          totalContracts: totalContracts || 0,
          totalPortfolioValue,
          totalCollections,
          upcomingPayments
        };
      } catch (error) {
        console.error('Error fetching summary:', error);
        return { totalContracts: 0, totalPortfolioValue: 0, totalCollections: 0, upcomingPayments: 0 };
      }
    }
  });

  return {
    summary,
    isLoadingSummary
  };
}
