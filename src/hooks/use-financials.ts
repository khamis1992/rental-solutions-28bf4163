import { useFinancialFilters } from './use-financial-filters';
import { useFinancialTransactions } from './use-financial-transactions';
import { useFinancialSummary } from './use-financial-summary';
import { useRecurringPaymentsCheck } from './use-recurring-payments-check';
import { useFinancialMutations } from './use-financial-mutations';
import { useExpenseMutations } from './use-expense-mutations';
import { FinancialTransaction, FinancialSummary } from './financials-types';

const getSystemDate = () => new Date();

import { useEffect } from 'react';

export function useFinancials() {
  // Modular hooks for filters, transactions, summary, and recurring payment checks
  const { filters, setFilters, expenseFilters, setExpenseFilters } = useFinancialFilters();
  const { data: transactions = [], isLoading: isLoadingTransactions, refetch: refetchTransactions } = useFinancialTransactions(filters);
  const { data: financialSummary, isLoading: isLoadingSummary, refetch: refetchSummary } = useFinancialSummary();
  useRecurringPaymentsCheck();

  // Expense modularization (legacy expense logic should be removed from this file)
  // Mutations
  const { addTransaction, updateTransaction, deleteTransaction } = useFinancialMutations(refetchTransactions, refetchSummary);
  const { addExpense, updateExpense, deleteExpense } = useExpenseMutations(refetchTransactions, refetchSummary);


  return {
    transactions,
    isLoadingTransactions,
    financialSummary,
    isLoadingSummary,
    filters,
    setFilters,
    expenseFilters,
    setExpenseFilters,
    addTransaction: addTransaction.mutate,
    updateTransaction: updateTransaction.mutate,
    deleteTransaction: deleteTransaction.mutate,
    addExpense: addExpense.mutate,
    updateExpense: updateExpense.mutate,
    deleteExpense: deleteExpense.mutate,
    systemDate: getSystemDate(),
  };
}
