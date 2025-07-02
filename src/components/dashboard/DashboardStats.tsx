// @ts-nocheck
/* eslint-disable */
import React, { useMemo } from 'react';
import { Car, DollarSign, Users, FileText } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { DashboardStats as DashboardStatsType } from '@/hooks/use-dashboard';
import { formatCurrency } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/utils/translation-helper';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatQatarRiyal } from '@/utils/arabic-rtl-utils';

interface DashboardStatsProps {
  stats?: DashboardStatsType;
  loading?: boolean;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, loading = false }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language } = useLanguage();
  
  // Generate sample sparkline data - in a real app, this would come from historical data
  const sparklineData = useMemo(() => ({
    vehicles: [15, 17, 20, 22, 25, 27, 28],
    revenue: [5000, 6200, 5800, 7500, 7200, 8100, 9200],
    customers: [110, 125, 130, 145, 160, 175, 190],
    agreements: [80, 95, 105, 115, 125, 130, 140]
  }), []);

  // Format currency with Qatar Riyal formatting
  const formatCurrencyArabic = (amount: number) => {
    return formatQatarRiyal(amount);
  };
  
  if (!stats && !loading) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 section-transition" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <StatCard
        title="إجمالي المركبات"
        value={loading ? '—' : stats?.vehicleStats.total.toString() || '0'}
        description={loading ? 'جاري التحميل...' : `متاحة: ${stats?.vehicleStats.available || 0}`}
        icon={Car}
        iconColor="text-blue-500"
        trend={loading ? 0 : stats?.vehicleStats.available && stats?.vehicleStats.total > 0 ? Math.round((stats.vehicleStats.available / stats.vehicleStats.total) * 100) : 0}
        trendLabel="معدل التوفر"
        className="transition-shadow hover:shadow-md"
        onClick={() => !loading && navigate('/vehicles')}
        sparkline={sparklineData.vehicles}
        showSparkline={!loading}
        loading={loading}
      />
      
      <StatCard
        title="الإيرادات"
        value={loading ? '—' : formatCurrencyArabic(stats?.financialStats.currentMonthRevenue || 0)}
        description={loading ? 'جاري التحميل...' : 'هذا الشهر'}
        icon={DollarSign}
        iconColor="text-green-500"
        trend={loading ? 0 : stats?.financialStats.revenueGrowth || 0}
        trendLabel="مقارنة بالشهر الماضي"
        className="transition-shadow hover:shadow-md"
        onClick={() => !loading && navigate('/financials')}
        sparkline={sparklineData.revenue}
        showSparkline={!loading}
        loading={loading}
      />
      
      <StatCard
        title="العملاء النشطون"
        value={loading ? '—' : stats?.customerStats.active.toString() || '0'}
        description={loading ? 'جاري التحميل...' : `الإجمالي: ${stats?.customerStats.total || 0}`}
        icon={Users}
        iconColor="text-violet-500"
        trend={loading ? 0 : stats?.customerStats.growth || 0}
        trendLabel="مقارنة بالشهر الماضي"
        className="transition-shadow hover:shadow-md"
        onClick={() => !loading && navigate('/customers')}
        sparkline={sparklineData.customers}
        showSparkline={!loading}
        loading={loading}
      />
      
      <StatCard
        title="العقود"
        value={loading ? '—' : stats?.agreementStats.active.toString() || '0'}
        description={loading ? 'جاري التحميل...' : 'العقود النشطة'}
        icon={FileText}
        iconColor="text-amber-500"
        trend={loading ? 0 : stats?.agreementStats.growth || 0}
        trendLabel="مقارنة بالشهر الماضي"
        className="transition-shadow hover:shadow-md"
        onClick={() => !loading && navigate('/agreements')}
        sparkline={sparklineData.agreements}
        showSparkline={!loading}
        loading={loading}
      />
    </div>
  );
};

export default DashboardStats;
