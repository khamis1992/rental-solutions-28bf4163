import { useMemo } from 'react';
import { useFinancials } from './use-financials';
import { useCarInstallments } from './use-car-installments';

export interface UnifiedFinancialSummary {
  // Existing rental financials
  rentalIncome: number;
  rentalExpenses: number;
  
  // New installment financials
  installmentIncome: number;
  installmentPending: number;
  installmentOverdue: number;
  
  // Combined totals
  totalIncome: number;
  totalExpenses: number;
  netRevenue: number;
  
  // Performance metrics
  collectionRate: number;
  overdueRate: number;
  portfolioValue: number;
  
  // Additional metrics
  totalContracts: number;
  upcomingPayments: number;
}

const calculateOverdueAmount = (installmentSummary: any) => {
  // Calculate overdue amount from installment data
  // This would need to be implemented based on your data structure
  return 0; // Placeholder
};

const calculateCollectionRate = (installmentSummary: any) => {
  if (!installmentSummary?.totalPortfolioValue || installmentSummary.totalPortfolioValue === 0) {
    return 0;
  }
  return (installmentSummary.totalCollections / installmentSummary.totalPortfolioValue) * 100;
};

const calculateOverdueRate = (installmentSummary: any) => {
  if (!installmentSummary?.totalContracts || installmentSummary.totalContracts === 0) {
    return 0;
  }
  // This would need to be calculated based on overdue contracts
  return 0; // Placeholder
};

export const useUnifiedFinancials = () => {
  const { financialSummary: rentalSummary, isLoadingSummary: isLoadingRental } = useFinancials();
  const { summary: installmentSummary, isLoading: isLoadingInstallments } = useCarInstallments();
  
  const unifiedSummary: UnifiedFinancialSummary = useMemo(() => {
    const rentalIncome = rentalSummary?.totalIncome || 0;
    const installmentIncome = installmentSummary?.totalCollections || 0;
    const installmentPending = installmentSummary?.upcomingPayments || 0;
    const rentalExpenses = rentalSummary?.totalExpenses || 0;
    
    return {
      rentalIncome,
      rentalExpenses,
      installmentIncome,
      installmentPending,
      installmentOverdue: calculateOverdueAmount(installmentSummary),
      totalIncome: rentalIncome + installmentIncome,
      totalExpenses: rentalExpenses,
      netRevenue: (rentalIncome + installmentIncome) - rentalExpenses,
      collectionRate: calculateCollectionRate(installmentSummary),
      overdueRate: calculateOverdueRate(installmentSummary),
      portfolioValue: installmentSummary?.totalPortfolioValue || 0,
      totalContracts: installmentSummary?.totalContracts || 0,
      upcomingPayments: installmentPending
    };
  }, [rentalSummary, installmentSummary]);
  
  const isLoading = isLoadingRental || isLoadingInstallments;
  
  return { 
    unifiedSummary, 
    isLoading,
    rentalSummary,
    installmentSummary
  };
}; 