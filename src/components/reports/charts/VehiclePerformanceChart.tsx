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
      title="تحليل أداء المركبات"
      description="مقارنة الإيرادات وتكاليف الصيانة ومعدل الاستغلال عبر المركبات"
      data={data}
      defaultChartType="bar"
      allowedChartTypes={['bar', 'line']}
      xAxisKey="name"
      series={[
        { key: 'revenue', name: 'الإيرادات', color: '#22c55e' },
        { key: 'maintenanceCosts', name: 'تكاليف الصيانة', color: '#ef4444' },
        { key: 'profit', name: 'الربح', color: '#3b82f6' },
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
          name: 'حالة المركبة',
          options: [
            { label: 'متاحة', value: 'available' },
            { label: 'مؤجرة', value: 'rented' },
            { label: 'في الصيانة', value: 'maintenance' },
            { label: 'خارج الخدمة', value: 'out_of_service' }
          ]
        },
        {
          key: 'vehicleType',
          name: 'نوع المركبة',
          options: [
            ...new Set(data.map(v => v.vehicleType))
          ].filter(Boolean).map(type => ({ label: String(type), value: String(type) }))
        }
      ]}
    />
  );
};

export default VehiclePerformanceChart;
