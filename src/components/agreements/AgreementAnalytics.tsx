import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart4, Calendar, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAgreementService } from '@/hooks/services/useAgreementService';

interface AgreementAnalyticsProps {
  onFilterApply?: (filters: Record<string, any>) => void;
}

export function AgreementAnalytics({ onFilterApply }: AgreementAnalyticsProps) {
  const { agreements, isLoading } = useAgreementService();

  // حساب التحليلات من البيانات الحقيقية
  const analytics = useMemo(() => {
    if (!agreements || agreements.length === 0) {
      return {
        expiringCount: 0,
        totalRevenue: 0,
        statusDistribution: {
          active: 0,
          pending: 0,
          cancelled: 0,
          draft: 0,
          expired: 0,
          closed: 0
        }
      };
    }

    // حساب العقود التي ستنتهي خلال 30 يوم
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const expiringAgreements = agreements.filter(agreement => {
      if (!agreement.end_date) return false;
      const endDate = new Date(agreement.end_date);
      return endDate >= today && endDate <= thirtyDaysFromNow;
    });

    // حساب إجمالي الإيرادات الشهرية من العقود النشطة
    const activeAgreements = agreements.filter(agreement => agreement.status === 'active');
    const totalRevenue = activeAgreements.reduce((sum, agreement) => {
      return sum + (agreement.rent_amount || 0);
    }, 0);

    // حساب توزيع حالات العقود
    const statusDistribution = agreements.reduce((acc, agreement) => {
      const status = agreement.status || 'draft';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      expiringCount: expiringAgreements.length,
      totalRevenue,
      statusDistribution
    };
  }, [agreements]);

  // حساب النسب المئوية لتوزيع العقود
  const distributionPercentages = useMemo(() => {
    if (!agreements || agreements.length === 0) return '';
    
    const total = agreements.length;
    const active = ((analytics.statusDistribution.active || 0) / total * 100).toFixed(0);
    const pending = ((analytics.statusDistribution.pending || 0) / total * 100).toFixed(0);
    const others = (100 - parseInt(active) - parseInt(pending)).toFixed(0);
    
    return `${active}% نشطة، ${pending}% معلقة، ${others}% أخرى`;
  }, [agreements, analytics.statusDistribution]);

  // إضافة دالة لتطبيق فلتر العقود التي ستنتهي خلال 30 يوماً
  const handleExpiringContractsFilter = () => {
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    const filters = {
      end_date_after: today.toISOString().split('T')[0], // Format as YYYY-MM-DD
      end_date_before: next30Days.toISOString().split('T')[0] // Format as YYYY-MM-DD
    };

    console.log('Applying expiring contracts filter:', filters);
    
    if (onFilterApply) {
      onFilterApply(filters);
    }
  };

  // إضافة دالة لتطبيق فلتر العقود النشطة
  const handleActiveContractsFilter = () => {
    const filters = {
      status: 'active'
    };

    console.log('Applying active contracts filter:', filters);
    
    if (onFilterApply) {
      onFilterApply(filters);
    }
  };

  // إضافة دالة لتطبيق فلتر عرض جميع العقود
  const handleAllContractsFilter = () => {
    const filters = {};

    console.log('Clearing all filters');
    
    if (onFilterApply) {
      onFilterApply(filters);
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full" dir="rtl">
        <CardHeader className="pb-2">
          <CardTitle className="text-md font-medium text-right">تحليلات العقود</CardTitle>
          <CardDescription className="text-right">رؤى سريعة حول عقودك</CardDescription>
        </CardHeader>
        <CardContent dir="rtl">
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">جاري تحميل التحليلات...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full" dir="rtl">
      <CardHeader className="pb-2">
        <div className="flex flex-row-reverse justify-between items-center">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleAllContractsFilter}
          >
            عرض الكل
          </Button>
          <CardTitle className="text-md font-medium text-right">تحليلات العقود</CardTitle>
        </div>
        <CardDescription className="text-right">رؤى سريعة حول عقودك</CardDescription>
      </CardHeader>
      <CardContent dir="rtl">
        <div className="space-y-4">
          {/* العقود التي ستنتهي قريباً */}
          <div 
            className="flex items-start space-x-reverse space-x-3 bg-muted/50 p-3 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
            onClick={handleExpiringContractsFilter}
          >
            <Calendar className="h-5 w-5 text-amber-500 mt-0.5 ml-3" />
            <div className="text-right">
              <h4 className="text-sm font-medium text-right">انتهاء صلاحية قريب</h4>
              <p className="text-xs text-muted-foreground text-right">
                {analytics.expiringCount} عقد ستنتهي صلاحيتها خلال 30 يوماً
              </p>
            </div>
          </div>
          
          {/* الإيرادات الشهرية */}
          <div 
            className="flex items-start space-x-reverse space-x-3 bg-muted/50 p-3 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
            onClick={handleActiveContractsFilter}
          >
            <TrendingUp className="h-5 w-5 text-emerald-500 mt-0.5 ml-3" />
            <div className="text-right">
              <h4 className="text-sm font-medium text-right">الإيرادات الشهرية</h4>
              <p className="text-xs text-muted-foreground text-right">
                {analytics.totalRevenue.toLocaleString()} ريال قطري من العقود النشطة
              </p>
            </div>
          </div>
          
          {/* توزيع العقود */}
          <div 
            className="flex items-start space-x-reverse space-x-3 bg-muted/50 p-3 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
            onClick={handleAllContractsFilter}
          >
            <BarChart4 className="h-5 w-5 text-blue-500 mt-0.5 ml-3" />
            <div className="text-right">
              <h4 className="text-sm font-medium text-right">توزيع العقود</h4>
              <p className="text-xs text-muted-foreground text-right">
                {distributionPercentages}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
