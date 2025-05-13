
export interface RevenueData {
  name: string;
  revenue: number;
  expenses?: number;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netRevenue: number;
  pendingPayments: number;
  unpaidInvoices?: number;
  installmentsPending?: number;
  currentMonthDue?: number;
  overdueExpenses?: number;
}
