
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  xAxisKey: string;
  yAxisKey: string;
  color: string;
  showGrid?: boolean;
  showLegend?: boolean;
}

export const prepareRevenueChartData = (
  data: { date: string; amount: number }[]
): ChartDataPoint[] => {
  return data.map(item => ({
    date: item.date,
    value: item.amount,
    label: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(item.amount),
  }));
};

export const prepareVehicleStatusData = (
  vehicles: { status: string }[]
): ChartDataPoint[] => {
  const statusCounts = vehicles.reduce((acc, vehicle) => {
    acc[vehicle.status] = (acc[vehicle.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(statusCounts).map(([status, count]) => ({
    date: status,
    value: count,
    label: `${count} vehicles`,
  }));
};

export const aggregateDataByPeriod = (
  data: { date: string; value: number }[],
  period: 'daily' | 'weekly' | 'monthly'
): ChartDataPoint[] => {
  const grouped = data.reduce((acc, item) => {
    const date = new Date(item.date);
    let key: string;

    switch (period) {
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'monthly':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        key = item.date;
    }

    acc[key] = (acc[key] || 0) + item.value;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(grouped).map(([date, value]) => ({
    date,
    value,
  }));
};
