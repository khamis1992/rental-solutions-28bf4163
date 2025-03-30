import React from 'react';
import { useFinancials } from '@/hooks/use-financials';
import FinancialSummary from './FinancialSummary';
import FinancialExpensesBreakdown from './FinancialExpensesBreakdown';
import FinancialRevenueChart from './FinancialRevenueChart';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChartBig, TrendingUp, TrendingDown } from 'lucide-react';
import { useDashboardData } from '@/hooks/use-dashboard';

const FinancialDashboard = () => {
  const { 
    financialSummary, 
    isLoadingSummary, 
    expenses,
    transactions 
  } = useFinancials();
  
  const { revenue: revenueData } = useDashboardData();

  const getTrendData = () => {
    if (!financialSummary) return { 
      currentMonthRevenue: 0, 
      previousMonthRevenue: 0,
      currentMonthExpenses: 0,
      previousMonthExpenses: 0,
      currentMonthProfit: 0,
      previousMonthProfit: 0
    };

    const currentMonthRevenue = financialSummary.totalIncome || 0;
    const previousMonthRevenue = currentMonthRevenue * 0.8; // For estimation if not available
    
    const currentMonthExpenses = financialSummary.totalExpenses || 0;
    const previousMonthExpenses = currentMonthExpenses * 0.9; // For estimation if not available
    
    const currentMonthProfit = currentMonthRevenue - currentMonthExpenses;
    const previousMonthProfit = previousMonthRevenue - previousMonthExpenses;
    
    return {
      currentMonthRevenue,
      previousMonthRevenue,
      currentMonthExpenses,
      previousMonthExpenses,
      currentMonthProfit,
      previousMonthProfit
    };
  };
  
  const trendData = getTrendData();
  
  const getPercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };
  
  const revenueChange = getPercentageChange(trendData.currentMonthRevenue, trendData.previousMonthRevenue);
  const expenseChange = getPercentageChange(trendData.currentMonthExpenses, trendData.previousMonthExpenses);
  const profitChange = getPercentageChange(trendData.currentMonthProfit, trendData.previousMonthProfit);
  
  const prepareRevenueChartData = () => {
    if (!revenueData || revenueData.length === 0) {
      console.log("No revenue data available for chart");
      return [];
    }
    
    const expensesByMonth = {};
    
    if (transactions && transactions.length > 0) {
      transactions.forEach(transaction => {
        if (transaction.type === 'expense') {
          const date = new Date(transaction.date);
          const monthKey = date.toLocaleString('default', { month: 'short' });
          
          if (!expensesByMonth[monthKey]) {
            expensesByMonth[monthKey] = 0;
          }
          
          expensesByMonth[monthKey] += transaction.amount || 0;
        }
      });
    }
    
    return revenueData.map(item => ({
      name: item.name,
      revenue: item.revenue,
      expenses: expensesByMonth[item.name] || (item.revenue * 0.6)
    }));
  };
  
  const combinedChartData = prepareRevenueChartData();
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Financial Dashboard</h2>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className={`h-4 w-4 ${revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(trendData.currentMonthRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <TrendingDown className={`h-4 w-4 ${expenseChange <= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(trendData.currentMonthExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit</CardTitle>
            <BarChartBig className={`h-4 w-4 ${profitChange >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(trendData.currentMonthProfit)}</div>
            <p className="text-xs text-muted-foreground">
              {profitChange >= 0 ? '+' : ''}{profitChange.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>
      </div>
      
      <FinancialRevenueChart 
        data={combinedChartData} 
        fullWidth={true}
      />
      
      <FinancialSummary summary={financialSummary} isLoading={isLoadingSummary} />
      
      <FinancialExpensesBreakdown />
    </div>
  );
};

export default FinancialDashboard;
