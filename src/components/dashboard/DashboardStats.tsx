
import React from 'react';
import { Car, DollarSign, Users, FileText } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { DashboardStats as DashboardStatsType } from '@/hooks/use-dashboard';
import { formatCurrency } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface DashboardStatsProps {
  stats?: DashboardStatsType;
  loading?: boolean;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, loading = false }) => {
  const navigate = useNavigate();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 section-transition">
      <StatCard
        title="Total Vehicles"
        value={loading ? "—" : stats?.vehicleStats.total.toString() || "0"}
        description={loading ? "Loading..." : `Available: ${stats?.vehicleStats.available || 0}`}
        icon={Car}
        iconColor="text-blue-500"
        isLoading={loading}
        onClick={() => !loading && navigate('/vehicles')}
      />
      
      <StatCard
        title="Revenue"
        value={loading ? "—" : formatCurrency(stats?.financialStats.currentMonthRevenue || 0)}
        description={loading ? "Loading..." : "This month"}
        icon={DollarSign}
        iconColor="text-green-500"
        isLoading={loading}
        onClick={() => !loading && navigate('/financials')}
        trend={loading ? undefined : stats?.financialStats.revenueGrowth}
        trendLabel="vs last month"
      />
      
      <StatCard
        title="Active Customers"
        value={loading ? "—" : stats?.customerStats.active.toString() || "0"}
        description={loading ? "Loading..." : `Total: ${stats?.customerStats.total || 0}`}
        icon={Users}
        iconColor="text-violet-500"
        isLoading={loading}
        onClick={() => !loading && navigate('/customers')}
        trend={loading ? undefined : stats?.customerStats.growth}
        trendLabel="vs last month"
      />
      
      <StatCard
        title="Active Agreements"
        value={loading ? "—" : stats?.agreementStats.active.toString() || "0"}
        description={loading ? "Loading..." : "Active agreements"}
        icon={FileText}
        iconColor="text-amber-500"
        isLoading={loading}
        onClick={() => !loading && navigate('/agreements')}
        trend={loading ? undefined : stats?.agreementStats.growth}
        trendLabel="vs last month"
      />
    </div>
  );
};

export default DashboardStats;
