import { useState } from 'react';

export interface FinancialFilters {
  transactionType: string;
  category: string;
  dateFrom: string;
  dateTo: string;
  searchQuery: string;
}

export interface ExpenseFilters {
  category: string;
  dateFrom: string;
  dateTo: string;
  searchQuery: string;
  recurringOnly: boolean;
}

export function useFinancialFilters() {
  const [filters, setFilters] = useState<FinancialFilters>({
    transactionType: '',
    category: '',
    dateFrom: '',
    dateTo: '',
    searchQuery: '',
  });

  const [expenseFilters, setExpenseFilters] = useState<ExpenseFilters>({
    category: '',
    dateFrom: '',
    dateTo: '',
    searchQuery: '',
    recurringOnly: false,
  });

  return {
    filters,
    setFilters,
    expenseFilters,
    setExpenseFilters,
  };
}
