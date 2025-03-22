
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';
import { FinancialSummary as FinancialSummaryType } from '@/hooks/use-financials';
import { formatCurrency } from '@/lib/utils';

interface FinancialSummaryProps {
  summary?: FinancialSummaryType;
  isLoading: boolean;
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({ summary, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(5)].map((_, index) => (
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

  if (!summary) {
    return <div>No financial data available.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      <StatCard
        title="Total Income"
        value={formatCurrency(summary.totalIncome)}
        description="All time revenue"
        icon={TrendingUp}
        iconColor="text-green-500"
      />
      
      <StatCard
        title="Total Expenses"
        value={formatCurrency(summary.totalExpenses)}
        description="All time expenses"
        icon={TrendingDown}
        iconColor="text-red-500"
      />
      
      <StatCard
        title="Net Revenue"
        value={formatCurrency(summary.netRevenue)}
        description="Total profit"
        icon={DollarSign}
        iconColor="text-blue-500"
        trend={5}
        trendLabel="vs last month"
      />
      
      <StatCard
        title="Pending Payments"
        value={formatCurrency(summary.pendingPayments)}
        description="Awaiting processing"
        icon={Clock}
        iconColor="text-amber-500"
      />
      
      <StatCard
        title="Unpaid Invoices"
        value={formatCurrency(summary.unpaidInvoices)}
        description="Outstanding balance"
        icon={AlertTriangle}
        iconColor="text-red-500"
      />
    </div>
  );
};

export default FinancialSummary;
