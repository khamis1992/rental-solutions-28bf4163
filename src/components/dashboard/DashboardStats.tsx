
import React, { useMemo } from 'react';
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
  
  // Generate sample sparkline data - in a real app, this would come from historical data
  const sparklineData = useMemo(() => ({
    vehicles: [15, 17, 20, 22, 25, 27, 28],
    revenue: [5000, 6200, 5800, 7500, 7200, 8100, 9200],
    customers: [110, 125, 130, 145, 160, 175, 190],
    agreements: [80, 95, 105, 115, 125, 130, 140]
  }), []);
  
  if (!stats && !loading) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 section-transition">
      <StatCard
        title="Total Vehicles"
        value={loading ? "—" : stats?.vehicleStats.total.toString() || "0"}
        description={loading ? "Loading..." : `Available: ${stats?.vehicleStats.available || 0}`}
        icon={Car}
        iconColor="text-blue-500"
        trend={loading ? 0 : stats?.vehicleStats.available && stats?.vehicleStats.total > 0 ? 
          Math.round((stats.vehicleStats.available / stats.vehicleStats.total) * 100) : 0}
        trendLabel="availability rate"
        className="transition-shadow hover:shadow-md"
        onClick={() => !loading && navigate('/vehicles')}
        sparkline={sparklineData.vehicles}
        showSparkline={!loading}
        loading={loading}
      />
      
      <StatCard
        title="Revenue"
        value={loading ? "—" : formatCurrency(stats?.financialStats.currentMonthRevenue || 0)}
        description={loading ? "Loading..." : "This month"}
        icon={DollarSign}
        iconColor="text-green-500"
        trend={loading ? 0 : stats?.financialStats.revenueGrowth || 0}
        trendLabel="vs last month"
        className="transition-shadow hover:shadow-md"
        onClick={() => !loading && navigate('/financials')}
        sparkline={sparklineData.revenue}
        showSparkline={!loading}
        loading={loading}
      />
      
      <StatCard
        title="Active Customers"
        value={loading ? "—" : stats?.customerStats.active.toString() || "0"}
        description={loading ? "Loading..." : `Total: ${stats?.customerStats.total || 0}`}
        icon={Users}
        iconColor="text-violet-500"
        trend={loading ? 0 : stats?.customerStats.growth || 0}
        trendLabel="vs last month"
        className="transition-shadow hover:shadow-md"
        onClick={() => !loading && navigate('/customers')}
        sparkline={sparklineData.customers}
        showSparkline={!loading}
        loading={loading}
      />
      
      <StatCard
        title="Contracts"
        value={loading ? "—" : stats?.agreementStats.active.toString() || "0"}
        description={loading ? "Loading..." : "Active agreements"}
        icon={FileText}
        iconColor="text-amber-500"
        trend={loading ? 0 : stats?.agreementStats.growth || 0}
        trendLabel="vs last month"
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
