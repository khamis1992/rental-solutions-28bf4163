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
      title="اتجاهات الأداء المالي الشهرية"
      description="تتبع الإيرادات والتكاليف والأرباح عبر آخر 12 شهر"
      data={data}
      defaultChartType="line"
      allowedChartTypes={['line', 'area', 'bar']}
      xAxisKey="month"
      series={[
        { key: 'revenue', name: 'الإيرادات', color: '#22c55e' },
        { key: 'maintenanceCosts', name: 'تكاليف الصيانة', color: '#ef4444' },
        { key: 'profit', name: 'الربح الصافي', color: '#3b82f6' },
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
