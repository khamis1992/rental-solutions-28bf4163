
import { DbId } from './database-common';

export interface FinancialTransaction {
  id: string;
  date: string | Date;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description?: string;
  status: 'pending' | 'completed' | 'failed';
  payment_method?: string;
  reference_number?: string;
  receipt_url?: string;
  recurring?: boolean;
  recurring_frequency?: string;
  next_date?: string | Date;
  created_at: string;
  updated_at: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  pendingIncome: number;
  pendingExpenses: number;
  recentTransactions: FinancialTransaction[];
  topCategories: {
    name: string;
    amount: number;
    percentage: number;
  }[];
  monthlyData: {
    month: string;
    income: number;
    expenses: number;
  }[];
}

export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'pending' | 'completed' | 'failed';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'mobile_payment' | 'other';

export interface TransactionCategory {
  id: string;
  name: string;
  type: TransactionType;
  icon?: string;
  color?: string;
}

export interface ExpenseCategory extends TransactionCategory {
  budget?: number;
  actual?: number;
  remaining?: number;
}
