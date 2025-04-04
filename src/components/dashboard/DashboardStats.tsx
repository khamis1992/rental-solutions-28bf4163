
import React from 'react';
import { Car, DollarSign, Users, FileText } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { DashboardStats as DashboardStatsType } from '@/hooks/use-dashboard';
import { formatCurrency } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useTranslation as useI18nTranslation } from 'react-i18next';

interface DashboardStatsProps {
  stats?: DashboardStatsType;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const navigate = useNavigate();
  const { t } = useI18nTranslation();
  
  if (!stats) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 section-transition">
      <StatCard
        title={t('dashboard.totalVehicles')}
        value={stats.vehicleStats.total.toString()}
        description={`${t('common.available')}: ${stats.vehicleStats.available}`}
        icon={Car}
        iconColor="text-blue-500"
        trend={stats.vehicleStats.available > 0 ? 
          Math.round((stats.vehicleStats.available / stats.vehicleStats.total) * 100) : 0}
        trendLabel="availability rate"
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate('/vehicles')}
      />
      
      <StatCard
        title={t('dashboard.totalRevenue')}
        value={formatCurrency(stats.financialStats.currentMonthRevenue)}
        description="This month"
        icon={DollarSign}
        iconColor="text-green-500"
        trend={stats.financialStats.revenueGrowth}
        trendLabel="vs last month"
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate('/financials')}
      />
      
      <StatCard
        title={t('common.customers')}
        value={stats.customerStats.active.toString()}
        description={`${t('common.total')}: ${stats.customerStats.total}`}
        icon={Users}
        iconColor="text-violet-500"
        trend={stats.customerStats.growth}
        trendLabel="vs last month"
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate('/customers')}
      />
      
      <StatCard
        title={t('common.agreements')}
        value={stats.agreementStats.active.toString()}
        description={t('dashboard.activeRentals')}
        icon={FileText}
        iconColor="text-amber-500"
        trend={stats.agreementStats.growth}
        trendLabel="vs last month"
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate('/agreements')}
      />
    </div>
  );
};

export default DashboardStats;
