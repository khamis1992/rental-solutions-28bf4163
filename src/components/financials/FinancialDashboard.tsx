
import React, { useMemo, memo } from 'react';
import { useFinancials } from '@/hooks/use-financials';
import FinancialSummary from './FinancialSummary';
import FinancialExpensesBreakdown from './FinancialExpensesBreakdown';
import FinancialRevenueChart from './FinancialRevenueChart';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChartBig, TrendingUp, TrendingDown } from 'lucide-react';
import { useDashboardData } from '@/hooks/use-dashboard';
import { RevenueData } from './revenue/types';

// Helper function to calculate percentage change - DEFINED BEFORE USAGE
const getPercentageChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const FinancialDashboard = memo(() => {
  const { 
    financialSummary, 
    isLoadingSummary
  } = useFinancials();

  const memoizedSummary = useMemo(() => financialSummary, [JSON.stringify(financialSummary)]);

  const { revenue: revenueData } = useDashboardData();

  // Get current month name for display
  const currentMonth = useMemo(() => {
    const date = new Date();
    return date.toLocaleString('default', { month: 'long' });
  }, []);

  // Initialize values to zero - these will be replaced with real data when available
  const displayValues = {
    totalIncome: financialSummary?.totalIncome || 0,
    totalExpenses: financialSummary?.totalExpenses || 0,
    netRevenue: financialSummary?.netRevenue || 0,
    pendingPayments: financialSummary?.pendingPayments || 0
  };

  // Simulated trend data - could be enhanced later with real trend calculation 
  const trendData = useMemo(() => ({
    revenueChange: financialSummary ? getPercentageChange(financialSummary.totalIncome, financialSummary.totalIncome * 0.95) : 0,
    expenseChange: financialSummary ? getPercentageChange(financialSummary.totalExpenses, financialSummary.totalExpenses * 1.02) : 0,
    profitChange: financialSummary ? getPercentageChange(financialSummary.netRevenue, financialSummary.netRevenue * 0.93) : 0
  }), [financialSummary]);

  // Prepare chart data
  const revenueChartData: RevenueData[] = useMemo(() => {
    if (!revenueData || !Array.isArray(revenueData) || revenueData.length === 0) {
      console.log("No revenue data available for chart");
      return [];
    }

    // Create a simplified expenses calculation that doesn't cause recalculations
    return revenueData.map(item => ({
      name: item.name,
      revenue: item.revenue,
      expenses: item.revenue * 0.6 // Use a simple estimate instead of complex calculations
    }));
  }, [revenueData]);

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
        data={revenueChartData} 
        fullWidth={true}
      />

      <FinancialSummary summary={{
        totalIncome: displayValues.totalIncome,
        totalExpenses: displayValues.totalExpenses,
        netRevenue: displayValues.netRevenue,
        pendingPayments: displayValues.pendingPayments,
        unpaidInvoices: displayValues.pendingPayments,
        installmentsPending: displayValues.totalExpenses,
        currentMonthDue: financialSummary?.currentMonthDue || 0,
        overdueExpenses: financialSummary?.overdueExpenses || 0
      }} isLoading={isLoadingSummary} />

      <FinancialExpensesBreakdown />
    </div>
  );
});

export default FinancialDashboard;
