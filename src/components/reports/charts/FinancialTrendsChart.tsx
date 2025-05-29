
import React from 'react';
import InteractiveChart from './InteractiveChart';
import { MonthlyTrendData } from '@/utils/cross-report-data-processors';
import { formatCurrency } from '@/lib/utils';

interface FinancialTrendsChartProps {
  data: MonthlyTrendData[];
}

const FinancialTrendsChart: React.FC<FinancialTrendsChartProps> = ({ data }) => {
  return (
    <InteractiveChart
      title="Revenue vs. Maintenance Costs"
      description="Monthly comparison of revenue and maintenance costs"
      data={data}
      defaultChartType="line"
      allowedChartTypes={['bar', 'line', 'area']}
      xAxisKey="month"
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
    />
  );
};

export default FinancialTrendsChart;
