
import React from 'react';
import InteractiveChart from './InteractiveChart';
import { VehicleTypeData } from '@/utils/cross-report-data-processors';
import { formatCurrency } from '@/lib/utils';

interface VehicleTypeChartProps {
  data: VehicleTypeData[];
}

const VehicleTypeChart: React.FC<VehicleTypeChartProps> = ({ data }) => {
  return (
    <InteractiveChart
      title="Vehicle Type Performance"
      description="Compare performance metrics across different vehicle types"
      data={data}
      defaultChartType="bar"
      allowedChartTypes={['bar', 'pie']}
      xAxisKey="vehicleType"
      series={[
        { key: 'totalRevenue', name: 'Total Revenue', color: '#22c55e' },
        { key: 'totalMaintenance', name: 'Total Maintenance', color: '#ef4444' },
        { key: 'totalProfit', name: 'Total Profit', color: '#3b82f6' },
        { key: 'averageUtilization', name: 'Avg. Utilization %', color: '#f59e0b' }
      ]}
      formatters={{
        totalRevenue: formatCurrency,
        totalMaintenance: formatCurrency,
        totalProfit: formatCurrency,
        averageUtilization: (value) => `${value.toFixed(2)}%`
      }}
      showDataTable={true}
    />
  );
};

export default VehicleTypeChart;
