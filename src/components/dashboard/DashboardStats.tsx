
import React from 'react';
import { Car, DollarSign, Users, FileText } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { DashboardStats as DashboardStatsType } from '@/hooks/use-dashboard';
import { formatCurrency } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface DashboardStatsProps {
  stats?: DashboardStatsType;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  if (!stats) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 section-transition">
      <StatCard
        title={t('dashboard.totalVehicles')}
        value={stats.vehicleStats.total.toString()}
        description={`${t('vehicles.available')}: ${stats.vehicleStats.available}`}
        icon={Car}
        iconColor="text-blue-500"
        trend={stats.vehicleStats.available > 0 ? 
          Math.round((stats.vehicleStats.available / stats.vehicleStats.total) * 100) : 0}
        trendLabel="availability rate"
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate('/vehicles')}
      />
      
      <StatCard
        title={t('financials.revenue')}
        value={formatCurrency(stats.financialStats.currentMonthRevenue)}
        description={t('financials.thisMonth')}
        icon={DollarSign}
        iconColor="text-green-500"
        trend={stats.financialStats.revenueGrowth}
        trendLabel={t('financials.vsLastMonth')}
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate('/financials')}
      />
      
      <StatCard
        title={t('dashboard.activeCustomers')}
        value={stats.customerStats.active.toString()}
        description={`${t('common.total')}: ${stats.customerStats.total}`}
        icon={Users}
        iconColor="text-violet-500"
        trend={stats.customerStats.growth}
        trendLabel={t('financials.vsLastMonth')}
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate('/customers')}
      />
      
      <StatCard
        title={t('agreements.title')}
        value={stats.agreementStats.active.toString()}
        description={t('agreements.activeAgreements')}
        icon={FileText}
        iconColor="text-amber-500"
        trend={stats.agreementStats.growth}
        trendLabel={t('financials.vsLastMonth')}
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate('/agreements')}
      />
    </div>
  );
};

export default DashboardStats;
