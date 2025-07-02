
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CircleDollarSign, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

import { useFinancials } from '@/hooks/use-financials';
import { formatCurrency } from '@/lib/utils';
import FinancialExpensesBreakdown from '@/components/financials/FinancialExpensesBreakdown';

interface CategoryTotal {
  total: number;
  income: number;
  expense: number;
}

const FinancialReport = () => {
  const { 
    financialSummary, 
    isLoadingSummary, 
    transactions, 
    isLoadingTransactions 
  } = useFinancials();

  if (isLoadingSummary || isLoadingTransactions) {
    return <div dir="rtl" className="text-center py-10">جاري تحميل البيانات المالية...</div>;
  }

  const categoryTotals = (transactions || []).reduce<Record<string, CategoryTotal>>((acc, transaction) => {
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
  }, {});

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
    <div className="space-y-8" dir="rtl">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="إجمالي الإيرادات" 
          value={formatCurrency(financialSummary?.totalIncome || 0)} 
          trend={2.5}
          trendLabel="مقارنة بالشهر الماضي"
          icon={TrendingUp}
          iconColor="text-green-500"
        />
        <StatCard 
          title="إجمالي المصاريف" 
          value={formatCurrency(financialSummary?.totalExpenses || 0)} 
          trend={-1.2}
          trendLabel="مقارنة بالشهر الماضي"
          icon={TrendingDown}
          iconColor="text-red-500"
        />
        <StatCard 
          title="صافي الإيرادات" 
          value={formatCurrency(financialSummary?.netRevenue || 0)} 
          trend={3.4}
          trendLabel="مقارنة بالشهر الماضي"
          icon={CircleDollarSign}
          iconColor="text-blue-500"
        />
        <StatCard 
          title="المصاريف المتأخرة" 
          value={formatCurrency(financialSummary?.overdueExpenses ?? 0)} 
          trend={(financialSummary?.overdueExpenses ?? 0) > 0 ? 100 : 0}
          trendLabel="تحتاج انتباه"
          icon={AlertTriangle}
          iconColor="text-red-600"
        />
      </div>

      <FinancialExpensesBreakdown />

      <Card>
        <CardHeader>
          <CardTitle className="text-right">الإيرادات حسب الفئة</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الفئة</TableHead>
                <TableHead className="text-right">إجمالي الإيرادات</TableHead>
                <TableHead className="text-right">إجمالي المصاريف</TableHead>
                <TableHead className="text-right">الصافي</TableHead>
                <TableHead className="text-right">% من إجمالي الإيرادات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryAnalytics.length > 0 ? (
                categoryAnalytics.map((category, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium text-right">{category.category}</TableCell>
                    <TableCell className="text-green-600 text-right">{formatCurrency(category.incomeAmount)}</TableCell>
                    <TableCell className="text-red-600 text-right">{formatCurrency(category.expenseAmount)}</TableCell>
                    <TableCell className="text-right">
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
                    <TableCell className="text-right">{category.percentageOfTotal}%</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">لا توجد بيانات مالية متاحة</TableCell>
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
