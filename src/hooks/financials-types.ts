// Types for financials domain
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
