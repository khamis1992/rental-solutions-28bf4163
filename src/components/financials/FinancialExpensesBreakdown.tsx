
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { useFinancials } from '@/hooks/use-financials';
import { formatCurrency } from '@/lib/utils';
import { TrendingDown, Clock, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FinancialExpensesBreakdown: React.FC = () => {
  const { t } = useTranslation();
  const { financialSummary, isLoadingSummary } = useFinancials();

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
      <Card className="col-span-full animate-pulse">
        <CardHeader>
          <CardTitle>{t('financials.expenseAnalysis')}</CardTitle>
          <CardDescription>{t('common.loading')}</CardDescription>
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
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>{t('financials.expenseAnalysis')}</CardTitle>
        <CardDescription>{t('financials.expenseBreakdown')}</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title={t('financials.totalExpenses')}
            value={formatCurrency(financialData.totalExpenses)}
            description={t('financials.allExpenses')}
            icon={TrendingDown}
            iconColor="text-red-500"
          />
          
          <StatCard
            title={t('financials.currentMonthDue')}
            value={formatCurrency(financialData.currentMonthDue)}
            description={t('financials.installmentsDue')}
            icon={Clock}
            iconColor="text-amber-500"
          />
          
          <StatCard
            title={t('financials.overdueExpenses')}
            value={formatCurrency(financialData.overdueExpenses)}
            description={t('financials.pastDue')}
            icon={AlertTriangle}
            iconColor="text-red-600"
            trend={financialData.overdueExpenses > 0 ? 100 : 0}
            trendLabel={t('financials.requiresAttention')}
          />
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium text-gray-700 mb-2">{t('financials.expenseComposition')}</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('financials.regularExpenses')}</span>
              <span className="text-sm font-medium">
                {formatCurrency(financialData.regularExpenses)}
              </span>
            </div>
            
            {financialData.overdueExpenses > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-600 font-medium">{t('financials.overdueExpenses')}</span>
                <span className="text-sm font-medium text-red-600">
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
