
import React, { useMemo, memo } from 'react';
import { useFinancials } from '@/hooks/use-financials';
import FinancialSummary from './FinancialSummary';
import FinancialExpensesBreakdown from './FinancialExpensesBreakdown';
import FinancialRevenueChart from './FinancialRevenueChart';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChartBig, TrendingUp, TrendingDown } from 'lucide-react';
import { useDashboardData } from '@/hooks/use-dashboard';
import { 
  calculateTrendData, 
  prepareRevenueChartData, 
  prepareFinancialDisplayValues 
} from '@/services/financial/calculations';

const FinancialDashboard = memo(() => {
  const { 
    financialSummary, 
    isLoadingSummary
  } = useFinancials();

  const { revenue: revenueData } = useDashboardData();

  // Get current month name for display
  const currentMonth = useMemo(() => {
    const date = new Date();
    return date.toLocaleString('default', { month: 'long' });
  }, []);

  // Use the extracted calculation services
  const displayValues = prepareFinancialDisplayValues(financialSummary);
  const trendData = calculateTrendData(financialSummary);
  const chartData = prepareRevenueChartData(revenueData);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Financial Dashboard</h2>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue ({currentMonth})</CardTitle>
            <TrendingUp className={`h-4 w-4 ${trendData.revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(displayValues.totalIncome)}</div>
            <p className="text-xs text-muted-foreground">
              {trendData.revenueChange >= 0 ? '+' : ''}{trendData.revenueChange.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <TrendingDown className={`h-4 w-4 ${trendData.expenseChange <= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(displayValues.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              {trendData.expenseChange >= 0 ? '+' : ''}{trendData.expenseChange.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit</CardTitle>
            <BarChartBig className={`h-4 w-4 ${trendData.profitChange >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(displayValues.netRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {trendData.profitChange >= 0 ? '+' : ''}{trendData.profitChange.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <FinancialRevenueChart 
        data={chartData} 
        fullWidth={true}
      />

      <FinancialSummary summary={{
        totalIncome: displayValues.totalIncome,
        totalExpenses: displayValues.totalExpenses,
        netRevenue: displayValues.netRevenue,
        pendingPayments: displayValues.pendingPayments,
        unpaidInvoices: displayValues.pendingPayments,
        installmentsPending: displayValues.totalExpenses,
        currentMonthDue: displayValues.currentMonthDue,
        overdueExpenses: displayValues.overdueExpenses
      }} isLoading={isLoadingSummary} />

      <FinancialExpensesBreakdown />
    </div>
  );
});

export default FinancialDashboard;
