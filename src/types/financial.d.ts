
export type TransactionType = 'income' | 'expense' | string;
export type TransactionStatusType = 'pending' | 'completed' | 'cancelled' | string;

export interface FinancialTransaction {
  id: string;
  date: Date;
  amount: number;
  description: string;
  type: TransactionType;
  category: string;
  status: TransactionStatusType;
  reference: any;
  paymentMethod: string;
  isRecurring: boolean;
  recurringInterval: string;
  nextPaymentDate: Date;
}
