
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { useUnifiedFinancials } from '@/hooks/use-unified-financials';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/lib/utils';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  FileSpreadsheet,
  AlertTriangle,
  Clock,
  Target
} from 'lucide-react';
import FinancialRevenueChart from './FinancialRevenueChart';
import FinancialExpensesBreakdown from './FinancialExpensesBreakdown';

const UnifiedFinancialDashboard = () => {
  const { unifiedSummary, isLoading } = useUnifiedFinancials();
  const { language } = useLanguage();

  if (isLoading) {
    return (
      <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h2 className={`text-2xl font-bold tracking-tight ${language === 'ar' ? 'text-right' : 'text-left'}`}>
        {language === 'ar' ? 'لوحة التحكم المالية الموحدة' : 'Unified Financial Dashboard'}
      </h2>

      {/* Main Revenue Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title={language === 'ar' ? 'إيرادات الإيجار' : 'Rental Revenue'}
          value={formatCurrency(unifiedSummary.rentalIncome)}
          description={language === 'ar' ? 'من عقود الإيجار' : 'From rental agreements'}
          icon={DollarSign}
          iconColor="text-green-500"
          className={language === 'ar' ? 'text-right' : 'text-left'}
        />
        
        <StatCard
          title={language === 'ar' ? 'إيرادات الأقساط' : 'Installment Revenue'}
          value={formatCurrency(unifiedSummary.installmentIncome)}
          description={language === 'ar' ? 'من عقود التقسيط' : 'From installment contracts'}
          icon={FileSpreadsheet}
          iconColor="text-blue-500"
          className={language === 'ar' ? 'text-right' : 'text-left'}
        />
        
        <StatCard
          title={language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}
          value={formatCurrency(unifiedSummary.totalIncome)}
          description={language === 'ar' ? 'الإيرادات المجمعة' : 'Combined revenue'}
          icon={TrendingUp}
          iconColor="text-emerald-500"
          className={language === 'ar' ? 'text-right' : 'text-left'}
        />
        
        <StatCard
          title={language === 'ar' ? 'صافي الربح' : 'Net Profit'}
          value={formatCurrency(unifiedSummary.netRevenue)}
          description={language === 'ar' ? 'بعد المصروفات' : 'After expenses'}
          icon={BarChart3}
          iconColor={unifiedSummary.netRevenue >= 0 ? 'text-green-500' : 'text-red-500'}
          className={language === 'ar' ? 'text-right' : 'text-left'}
        />
      </div>

      {/* Installment-specific Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className={language === 'ar' ? 'text-right' : 'text-left'}>
            {language === 'ar' ? 'مؤشرات الأقساط' : 'Installment Metrics'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              title={language === 'ar' ? 'قيمة المحفظة' : 'Portfolio Value'}
              value={formatCurrency(unifiedSummary.portfolioValue)}
              description={language === 'ar' ? 'إجمالي قيمة العقود' : 'Total contract value'}
              icon={Target}
              iconColor="text-purple-500"
              className={language === 'ar' ? 'text-right' : 'text-left'}
            />
            
            <StatCard
              title={language === 'ar' ? 'معدل التحصيل' : 'Collection Rate'}
              value={`${unifiedSummary.collectionRate.toFixed(1)}%`}
              description={language === 'ar' ? 'نسبة التحصيل' : 'Collection percentage'}
              icon={TrendingUp}
              iconColor="text-green-500"
              className={language === 'ar' ? 'text-right' : 'text-left'}
            />
            
            <StatCard
              title={language === 'ar' ? 'العقود النشطة' : 'Active Contracts'}
              value={unifiedSummary.totalContracts.toString()}
              description={language === 'ar' ? 'عقود التقسيط' : 'Installment contracts'}
              icon={FileSpreadsheet}
              iconColor="text-blue-500"
              className={language === 'ar' ? 'text-right' : 'text-left'}
            />
            
            <StatCard
              title={language === 'ar' ? 'المدفوعات القادمة' : 'Upcoming Payments'}
              value={formatCurrency(unifiedSummary.upcomingPayments)}
              description={language === 'ar' ? 'خلال 30 يوم' : 'Next 30 days'}
              icon={Clock}
              iconColor="text-amber-500"
              className={language === 'ar' ? 'text-right' : 'text-left'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Revenue Chart */}
      <FinancialRevenueChart 
        data={[]} // This would need to be enhanced to include installment data
        fullWidth={true}
      />

      {/* Expenses Breakdown */}
      <FinancialExpensesBreakdown />

      {/* Alerts Section */}
      {(unifiedSummary.installmentOverdue > 0 || unifiedSummary.overdueRate > 10) && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 text-red-700 ${language === 'ar' ? 'flex-row-reverse text-right' : 'text-left'}`}>
              <AlertTriangle className="h-5 w-5" />
              {language === 'ar' ? 'تنبيهات مالية' : 'Financial Alerts'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unifiedSummary.installmentOverdue > 0 && (
                <p className={`text-red-600 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {language === 'ar' 
                    ? `يوجد ${formatCurrency(unifiedSummary.installmentOverdue)} من المدفوعات المتأخرة`
                    : `${formatCurrency(unifiedSummary.installmentOverdue)} in overdue payments`
                  }
                </p>
              )}
              {unifiedSummary.overdueRate > 10 && (
                <p className={`text-red-600 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {language === 'ar' 
                    ? `معدل التأخير مرتفع: ${unifiedSummary.overdueRate.toFixed(1)}%`
                    : `High overdue rate: ${unifiedSummary.overdueRate.toFixed(1)}%`
                  }
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UnifiedFinancialDashboard; 