
import React from 'react';
import InteractiveChart from './InteractiveChart';
import { VehicleUtilizationData } from '@/utils/cross-report-data-processors';
import { formatCurrency } from '@/lib/utils';

interface VehiclePerformanceChartProps {
  data: VehicleUtilizationData[];
}

const VehiclePerformanceChart: React.FC<VehiclePerformanceChartProps> = ({ data }) => {
  return (
    <InteractiveChart
      title="Vehicle Performance Analysis"
      description="Compare revenue, maintenance costs, and utilization across vehicles"
      data={data}
      defaultChartType="bar"
      allowedChartTypes={['bar', 'line']}
      xAxisKey="name"
      series={[
        { key: 'revenue', name: 'Revenue', color: '#22c55e' },
        { key: 'maintenanceCosts', name: 'Maintenance Costs', color: '#ef4444' },
        { key: 'profit', name: 'Profit', color: '#3b82f6' },
      ]}
      formatters={{
        revenue: formatCurrency,
        maintenanceCosts: formatCurrency,
        profit: formatCurrency
      }}
      showDataTable={true}
      filters={[
        {
          key: 'status',
          name: 'Vehicle Status',
          options: [
            { label: 'Available', value: 'available' },
            { label: 'Rented', value: 'rented' },
            { label: 'Maintenance', value: 'maintenance' },
            { label: 'Out of Service', value: 'out_of_service' }
          ]
        },
        {
          key: 'vehicleType',
          name: 'Vehicle Type',
          options: [
            ...new Set(data.map(v => v.vehicleType))
          ].filter(Boolean).map(type => ({ label: String(type), value: String(type) }))
        }
      ]}
    />
  );
};

export default VehiclePerformanceChart;
