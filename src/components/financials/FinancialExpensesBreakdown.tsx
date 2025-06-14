import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { useFinancials } from '@/hooks/use-financials';
import { formatCurrency } from '@/lib/utils';
import { TrendingDown, Clock, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const FinancialExpensesBreakdown: React.FC = () => {
  const { financialSummary, isLoadingSummary } = useFinancials();
  const { language } = useLanguage();

  // Use memo to avoid recalculation on each render
  const financialData = useMemo(() => {
    if (!financialSummary) {
      return {
        totalExpenses: 0,
        currentMonthDue: 0,
        overdueExpenses: 0,
        regularExpenses: 0
      };
    }
    
    // Ensure all values are proper numbers with explicit conversions
    const totalExp = parseFloat(Number(financialSummary.totalExpenses || 0).toFixed(2));
    const currentDue = parseFloat(Number(financialSummary.currentMonthDue || 0).toFixed(2));
    const overdue = parseFloat(Number(financialSummary.overdueExpenses || 0).toFixed(2));
    
    // Calculate regular expenses based on total minus overdue
    const regular = parseFloat((totalExp - overdue).toFixed(2));

    return {
      totalExpenses: totalExp,
      currentMonthDue: currentDue,
      overdueExpenses: overdue,
      regularExpenses: regular
    };
  }, [financialSummary]);

  if (isLoadingSummary) {
    return (
      <Card className="col-span-full animate-pulse" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <CardHeader className={language === 'ar' ? 'text-right' : 'text-left'}>
          <CardTitle>{language === 'ar' ? 'تحليل المصروفات' : 'Expense Analysis'}</CardTitle>
          <CardDescription>{language === 'ar' ? 'جاري تحميل بيانات المصروفات...' : 'Loading expense data...'}</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-24 bg-gray-200 rounded-md"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <CardHeader className={language === 'ar' ? 'text-right' : 'text-left'}>
        <CardTitle>{language === 'ar' ? 'تحليل المصروفات' : 'Expense Analysis'}</CardTitle>
        <CardDescription>{language === 'ar' ? 'تفصيل المصروفات حسب الحالة' : 'Breakdown of expenses by status'}</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title={language === 'ar' ? 'إجمالي المصروفات' : 'Total Expenses'}
            value={formatCurrency(financialData.totalExpenses)}
            description={language === 'ar' ? 'جميع المصروفات مجتمعة' : 'All expenses combined'}
            icon={TrendingDown}
            iconColor="text-red-500"
            className={language === 'ar' ? 'text-right' : 'text-left'}
          />
          
          <StatCard
            title={language === 'ar' ? 'المستحق هذا الشهر' : 'Current Month Due'}
            value={formatCurrency(financialData.currentMonthDue)}
            description={language === 'ar' ? 'الأقساط المستحقة هذا الشهر' : 'Installments due this month'}
            icon={Clock}
            iconColor="text-amber-500"
            className={language === 'ar' ? 'text-right' : 'text-left'}
          />
          
          <StatCard
            title={language === 'ar' ? 'المصروفات المتأخرة' : 'Overdue Expenses'}
            value={formatCurrency(financialData.overdueExpenses)}
            description={language === 'ar' ? 'مدفوعات الأقساط المتأخرة' : 'Past-due installment payments'}
            icon={AlertTriangle}
            iconColor="text-red-600"
            trend={financialData.overdueExpenses > 0 ? 100 : 0}
            trendLabel={language === 'ar' ? 'يتطلب انتباه' : 'Requires attention'}
            className={language === 'ar' ? 'text-right' : 'text-left'}
          />
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className={`text-sm font-medium text-gray-700 mb-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            {language === 'ar' ? 'تركيبة المصروفات' : 'Expense Composition'}
          </h3>
          <div className="space-y-3">
            <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <span className={`text-sm ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                {language === 'ar' ? 'المصروفات العادية' : 'Regular Expenses'}
              </span>
              <span className={`text-sm font-medium ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                {formatCurrency(financialData.regularExpenses)}
              </span>
            </div>
            
            {financialData.overdueExpenses > 0 && (
              <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <span className={`text-sm text-red-600 font-medium ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {language === 'ar' ? 'المصروفات المتأخرة' : 'Overdue Expenses'}
                </span>
                <span className={`text-sm font-medium text-red-600 ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                  {formatCurrency(financialData.overdueExpenses)}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialExpensesBreakdown;
