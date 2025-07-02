
import InteractiveChart from './InteractiveChart';
import { VehicleTypeData } from '@/utils/cross-report-data-processors';
import { formatCurrency } from '@/lib/utils';

interface VehicleTypeChartProps {
  data: VehicleTypeData[];
}

const VehicleTypeChart: React.FC<VehicleTypeChartProps> = ({ data }) => {
  return (
    <InteractiveChart
      title="تحليل أنواع المركبات"
      description="مقارنة الأداء المالي ومعدل الاستغلال حسب نوع المركبة"
      data={data}
      defaultChartType="bar"
      allowedChartTypes={['bar', 'pie']}
      xAxisKey="vehicleType"
      series={[
        { key: 'count', name: 'عدد المركبات', color: '#6366f1' },
        { key: 'totalRevenue', name: 'إجمالي الإيرادات', color: '#22c55e' },
        { key: 'totalMaintenance', name: 'إجمالي تكاليف الصيانة', color: '#ef4444' },
        { key: 'totalProfit', name: 'إجمالي الربح', color: '#3b82f6' },
      ]}
      formatters={{
        totalRevenue: formatCurrency,
        totalMaintenance: formatCurrency,
        totalProfit: formatCurrency,
        averageUtilization: (value: number) => `${value?.toFixed(1)}%`
      }}
      showDataTable={true}
    />
  );
};

export default VehicleTypeChart;
