
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { useFinancials } from '@/hooks/use-financials';
import { formatCurrency } from '@/lib/utils';
import { TrendingDown, Clock, AlertTriangle } from 'lucide-react';

const FinancialExpensesBreakdown: React.FC = () => {
  const { financialSummary, isLoadingSummary } = useFinancials();
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [currentMonthDue, setCurrentMonthDue] = useState(0);
  const [overdueExpenses, setOverdueExpenses] = useState(0);
  const [regularExpenses, setRegularExpenses] = useState(0);

  useEffect(() => {
    if (financialSummary) {
      // Ensure all values are proper numbers with explicit conversions
      const totalExp = parseFloat(Number(financialSummary.totalExpenses || 0).toFixed(2));
      const currentDue = parseFloat(Number(financialSummary.currentMonthDue || 0).toFixed(2));
      const overdue = parseFloat(Number(financialSummary.overdueExpenses || 0).toFixed(2));
      
      // Calculate regular expenses based on total minus overdue
      const regular = parseFloat(Number(totalExp - overdue).toFixed(2));

      console.log("FinancialExpensesBreakdown VALUES after explicit conversion:");
      console.log("Total Expenses:", totalExp, "Type:", typeof totalExp);
      console.log("Current Month Due:", currentDue, "Type:", typeof currentDue);
      console.log("Overdue Expenses:", overdue, "Type:", typeof overdue);
      console.log("Regular Expenses:", regular, "Type:", typeof regular);
      
      setTotalExpenses(totalExp);
      setCurrentMonthDue(currentDue);
      setOverdueExpenses(overdue);
      setRegularExpenses(regular);
    }
  }, [financialSummary]);

  if (isLoadingSummary) {
    return <div>Loading expense data...</div>;
  }

  if (!financialSummary) {
    return <div>No expense data available</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Analysis</CardTitle>
        <CardDescription>Breakdown of expenses by status</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total Expenses"
            value={formatCurrency(totalExpenses)}
            description="All expenses combined"
            icon={TrendingDown}
            iconColor="text-red-500"
          />
          
          <StatCard
            title="Current Month Due"
            value={formatCurrency(currentMonthDue)}
            description="Installments due this month"
            icon={Clock}
            iconColor="text-amber-500"
          />
          
          <StatCard
            title="Overdue Expenses"
            value={formatCurrency(overdueExpenses)}
            description="Past-due installment payments"
            icon={AlertTriangle}
            iconColor="text-red-600"
            trend={overdueExpenses > 0 ? 100 : 0}
            trendLabel="Requires attention"
          />
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Expense Composition</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Regular Expenses</span>
              <span className="text-sm font-medium">
                {formatCurrency(regularExpenses)}
              </span>
            </div>
            
            {overdueExpenses > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-600 font-medium">Overdue Expenses</span>
                <span className="text-sm font-medium text-red-600">
                  {formatCurrency(overdueExpenses)}
                </span>
              </div>
            )}
            
            <div className="border-t pt-2 flex items-center justify-between">
              <span className="text-sm font-medium">Total</span>
              <span className="text-sm font-medium">
                {formatCurrency(totalExpenses)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialExpensesBreakdown;
