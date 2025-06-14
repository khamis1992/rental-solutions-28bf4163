
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { 
  TrendingDown, 
  DollarSign, 
  Clock
} from 'lucide-react';
import { FinancialSummary as FinancialSummaryType } from '@/hooks/use-financials';
import { formatCurrency } from '@/lib/utils';

interface FinancialSummaryProps {
  summary?: FinancialSummaryType;
  isLoading: boolean;
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({ summary, isLoading }) => {
  // Get current month name for display
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="animate-pulse h-32">
            <CardContent className="p-6">
              <div className="h-full flex items-center justify-center">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Handle case when no summary data is available
  const safeData = summary || {
    totalIncome: 0,
    totalExpenses: 0,
    netRevenue: 0,
    pendingPayments: 0,
    unpaidInvoices: 0,
    installmentsPending: 0,
    currentMonthDue: 0,
    overdueExpenses: 0
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard
        title="Total Expenses"
        value={formatCurrency(safeData.currentMonthDue)}
        description="Current month's due installments"
        icon={TrendingDown}
        iconColor="text-red-500"
      />
      
      <StatCard
        title="Net Revenue"
        value={formatCurrency(safeData.netRevenue)}
        description="Income after expenses"
        icon={DollarSign}
        iconColor="text-blue-500"
      />
      
      <StatCard
        title="Pending Payments"
        value={formatCurrency(safeData.pendingPayments)}
        description="Upcoming rental payments"
        icon={Clock}
        iconColor="text-amber-500"
      />
    </div>
  );
};

export default FinancialSummary;
