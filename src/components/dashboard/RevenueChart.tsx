
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useTranslation } from '@/contexts/TranslationContext';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useOptimizedChartData, useChartMargin } from '@/utils/chart-utils';
import performanceMonitor from '@/utils/performance-monitor';

interface RevenueChartProps {
  data: { name: string; revenue: number }[];
  fullWidth?: boolean;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, fullWidth = false }) => {
  // Measure component render performance
  React.useEffect(() => {
    const perf = performanceMonitor.measureComponent('RevenueChart');
    perf.beforeRender();
    return () => {
      perf.afterRender();
    };
  }, []);
  
  const { t } = useI18nTranslation();
  const { isRTL } = useTranslation();
  
  // Get current month name for dynamic title
  const currentMonth = useMemo(() => {
    return new Date().toLocaleString('default', { month: 'long' });
  }, []);
  
  // Optimized ensure complete data function
  const ensureCompleteData = useMemo(() => {
    if (!data || data.length === 0) {
      const months = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          name: month.toLocaleString('default', { month: 'short' }),
          revenue: 0
        });
      }
      
      return months;
    }
    
    // Create a map of months we expect
    const months = [];
    const now = new Date();
    const dataMap: Record<string, number> = {};
    
    // Prepare the data map from existing data
    data.forEach(item => {
      dataMap[item.name] = item.revenue;
    });
    
    // Ensure all last 6 months have entries
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = month.toLocaleString('default', { month: 'short' });
      
      months.push({
        name: monthName,
        revenue: dataMap[monthName] || 0
      });
    }
    
    return months;
  }, [data]);
  
  // Use the optimized chart data hook for RTL support
  const displayData = useOptimizedChartData(ensureCompleteData, { 
    rtlReverse: true, 
    dataKeys: ['name', 'revenue']
  });
  
  // Use optimized chart margin
  const chartMargin = useChartMargin({
    top: 20,
    right: 30,
    left: 20,
    bottom: 10
  });

  return (
    <Card className={`card-transition ${fullWidth ? 'col-span-full' : 'col-span-3'}`}>
      <CardHeader className="pb-0">
        <CardTitle className={isRTL ? 'text-right' : ''}>
          {t('dashboard.revenueOverview', { month: currentMonth })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`${fullWidth ? 'h-96' : 'h-80'} dashboard-chart`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={displayData}
              margin={chartMargin}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                reversed={isRTL}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value).split('.')[0]} 
                orientation={isRTL ? 'right' : 'left'}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), t('dashboard.revenue')]}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  textAlign: isRTL ? 'right' : 'left',
                  direction: isRTL ? 'rtl' : 'ltr'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                strokeWidth={3}
                isAnimationActive={!isRTL} // Disable animation for RTL to improve performance
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Use memo to prevent unnecessary re-renders
export default React.memo(RevenueChart);
