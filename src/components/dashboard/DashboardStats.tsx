
import React from 'react';
import { Car, DollarSign, Users, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { DashboardStats as DashboardStatsType } from '@/hooks/use-dashboard';
import { formatCurrency } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  trend?: number;
  trendLabel?: string;
  bgClass?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title, value, description, icon: Icon, iconColor, trend, trendLabel, bgClass, onClick
}) => {
  const isPositiveTrend = trend !== undefined && trend >= 0;
  
  return (
    <div 
      className={`relative flex flex-col p-6 rounded-lg border shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer ${bgClass || 'bg-white'}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-full ${iconColor.replace('text-', 'bg-').replace('500', '100')}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${isPositiveTrend ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
            {isPositiveTrend ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {isPositiveTrend ? '+' : ''}{trend.toFixed(1)}%
          </div>
        )}
      </div>
      
      <h3 className="text-2xl font-bold mb-1 transition-colors">{value}</h3>
      <p className="text-sm font-medium text-gray-900">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
      
      {trendLabel && (
        <p className="text-xs mt-2 text-muted-foreground">
          {trendLabel}
        </p>
      )}
    </div>
  );
};

interface DashboardStatsProps {
  stats?: DashboardStatsType;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const navigate = useNavigate();
  
  if (!stats) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Vehicles"
        value={stats.vehicleStats.total.toString()}
        description={`${stats.vehicleStats.available} Available`}
        icon={Car}
        iconColor="text-blue-500"
        trend={stats.vehicleStats.available > 0 ? 
          Math.round((stats.vehicleStats.available / stats.vehicleStats.total) * 100) : 0}
        trendLabel={`${stats.vehicleStats.rented} Currently Rented`}
        bgClass="bg-gradient-to-br from-blue-50 to-white"
        onClick={() => navigate('/vehicles')}
      />
      
      <StatCard
        title="Monthly Revenue"
        value={formatCurrency(stats.financialStats.currentMonthRevenue)}
        description={`${stats.financialStats.revenueGrowth >= 0 ? '+' : ''}${stats.financialStats.revenueGrowth}% vs last month`}
        icon={DollarSign}
        iconColor="text-green-500"
        trend={stats.financialStats.revenueGrowth}
        trendLabel={`Last Month: ${formatCurrency(stats.financialStats.lastMonthRevenue)}`}
        bgClass="bg-gradient-to-br from-green-50 to-white"
        onClick={() => navigate('/financials')}
      />
      
      <StatCard
        title="Active Customers"
        value={stats.customerStats.active.toString()}
        description={`${stats.customerStats.growth >= 0 ? '+' : ''}${stats.customerStats.growth}% growth`}
        icon={Users}
        iconColor="text-violet-500"
        trend={stats.customerStats.growth}
        trendLabel={`Total Customers: ${stats.customerStats.total}`}
        bgClass="bg-gradient-to-br from-violet-50 to-white"
        onClick={() => navigate('/customers')}
      />
      
      <StatCard
        title="Active Contracts"
        value={stats.agreementStats.active.toString()}
        description={`${stats.agreementStats.growth >= 0 ? '+' : ''}${stats.agreementStats.growth}% vs last month`}
        icon={FileText}
        iconColor="text-amber-500"
        trend={stats.agreementStats.growth}
        trendLabel="Click to view all agreements"
        bgClass="bg-gradient-to-br from-amber-50 to-white"
        onClick={() => navigate('/agreements')}
      />
    </div>
  );
};

export default DashboardStats;
