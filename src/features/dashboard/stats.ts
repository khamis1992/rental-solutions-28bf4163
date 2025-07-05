
export interface DashboardStats {
  totalVehicles: number;
  activeAgreements: number;
  monthlyRevenue: number;
  pendingMaintenance: number;
  overdueFines: number;
  activeLegalCases: number;
}

export interface StatCard {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  color: string;
}

export const formatStatValue = (value: number, type: 'currency' | 'count'): string => {
  if (type === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  }
  
  return value.toLocaleString();
};

export const calculateTrend = (current: number, previous: number): {
  change: number;
  trend: 'up' | 'down' | 'neutral';
} => {
  if (previous === 0) {
    return { change: 0, trend: 'neutral' };
  }
  
  const change = ((current - previous) / previous) * 100;
  const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
  
  return { change: Math.abs(change), trend };
};

export const createStatCard = (
  title: string,
  current: number,
  previous: number,
  type: 'currency' | 'count',
  icon: string,
  color: string
): StatCard => {
  const { change, trend } = calculateTrend(current, previous);
  
  return {
    title,
    value: formatStatValue(current, type),
    change,
    trend,
    icon,
    color,
  };
};
