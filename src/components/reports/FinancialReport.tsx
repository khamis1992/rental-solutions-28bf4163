
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CircleDollarSign, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFinancials } from '@/hooks/use-financials';
import { formatCurrency } from '@/lib/utils';

const FinancialReport = () => {
  const { 
    financialSummary, 
    isLoadingSummary, 
    transactions, 
    isLoadingTransactions 
  } = useFinancials();

  if (isLoadingSummary || isLoadingTransactions) {
    return <div>Loading financial data...</div>;
  }

  // Calculate category totals from real transaction data with proper type checking
  const categoryTotals = transactions.reduce((acc, transaction) => {
    const category = transaction.category || 'Other';
    if (!acc[category]) {
      acc[category] = {
        total: 0,
        income: 0,
        expense: 0
      };
    }
    
    const amount = transaction.amount || 0;
    acc[category].total += amount;
    
    if (transaction.type === 'income') {
      acc[category].income += amount;
    } else {
      acc[category].expense += amount;
    }
    
    return acc;
  }, {} as Record<string, { total: number; income: number; expense: number }>);

  const categoryAnalytics = Object.entries(categoryTotals).map(([category, data]) => ({
    category,
    totalAmount: data.total,
    incomeAmount: data.income,
    expenseAmount: data.expense,
    percentageOfTotal: financialSummary?.totalIncome 
      ? ((data.income / financialSummary.totalIncome) * 100).toFixed(1) 
      : '0'
  }));

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Income" 
          value={formatCurrency(financialSummary?.totalIncome || 0)} 
          description="Revenue from car rentals"
          icon={TrendingUp}
          iconColor="text-green-500"
        />
        <StatCard 
          title="Total Expenses" 
          value={formatCurrency(financialSummary?.totalExpenses || 0)} 
          description="Car installments and operational costs"
          icon={TrendingDown}
          iconColor="text-red-500"
        />
        <StatCard 
          title="Net Revenue" 
          value={formatCurrency(financialSummary?.netRevenue || 0)} 
          description="Income after expenses"
          icon={CircleDollarSign}
          iconColor="text-blue-500"
        />
        <StatCard 
          title="Pending Payments" 
          value={formatCurrency(financialSummary?.pendingPayments || 0)} 
          description="Upcoming rental payments"
          icon={Clock}
          iconColor="text-amber-500"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Total Income</TableHead>
                <TableHead>Total Expenses</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>% of Total Income</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryAnalytics.length > 0 ? (
                categoryAnalytics.map((category, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{category.category}</TableCell>
                    <TableCell className="text-green-600">{formatCurrency(category.incomeAmount)}</TableCell>
                    <TableCell className="text-red-600">{formatCurrency(category.expenseAmount)}</TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          category.incomeAmount - category.expenseAmount > 0 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                        }
                      >
                        {formatCurrency(category.incomeAmount - category.expenseAmount)}
                      </Badge>
                    </TableCell>
                    <TableCell>{category.percentageOfTotal}%</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">No financial data available</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialReport;
