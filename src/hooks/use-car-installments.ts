
// Main hook that combines all car installment hooks
import { useCarInstallmentContracts } from './car-installments/use-car-installment-contracts';
import { useCarInstallmentPayments } from './car-installments/use-car-installment-payments';
import { useCarInstallmentSummary } from './car-installments/use-car-installment-summary';

export const useCarInstallments = () => {
  const contractsHook = useCarInstallmentContracts();
  const paymentsHook = useCarInstallmentPayments();
  const summaryHook = useCarInstallmentSummary();

  // Combine and return all hooks data and methods
  return {
    // From contracts hook
    contracts: contractsHook.contracts,
    isLoadingContracts: contractsHook.isLoadingContracts,
    error: contractsHook.error,
    contractFilters: contractsHook.contractFilters,
    setContractFilters: contractsHook.setContractFilters,
    fetchContracts: contractsHook.fetchContracts,
    createContract: contractsHook.createContract,

    // From payments hook
    payments: paymentsHook.payments,
    isLoadingPayments: paymentsHook.isLoadingPayments,
    selectedContract: paymentsHook.selectedContract,
    setSelectedContract: paymentsHook.setSelectedContract,
    paymentFilters: paymentsHook.paymentFilters,
    setPaymentFilters: paymentsHook.setPaymentFilters,
    fetchContractPayments: paymentsHook.fetchContractPayments,
    recordPayment: paymentsHook.recordPayment,
    importPayments: paymentsHook.importPayments,
    updatePaymentStatus: paymentsHook.updatePaymentStatus,
    addPayment: paymentsHook.addPayment,

    // From summary hook
    summary: summaryHook.summary,
    isLoadingSummary: summaryHook.isLoadingSummary,

    // Combined loading state for backward compatibility
    isLoading: contractsHook.isLoadingContracts || summaryHook.isLoadingSummary
  };
};

// Re-export everything from the hooks for direct imports if needed
export * from './car-installments';
