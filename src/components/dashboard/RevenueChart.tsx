
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useTranslation } from '@/contexts/TranslationContext';
import { useTranslation as useI18nTranslation } from 'react-i18next';

interface RevenueChartProps {
  data: { name: string; revenue: number }[];
  fullWidth?: boolean;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, fullWidth = false }) => {
  const { t } = useI18nTranslation();
  const { isRTL } = useTranslation();
  
  // Get current month name for dynamic title
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  
  // Ensure we have data to display, showing at least the last 6 months
  const ensureCompleteData = (inputData: { name: string; revenue: number }[]) => {
    if (!inputData || inputData.length === 0) return [];
    
    // List of expected months (last 6 months)
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(month.toLocaleString('default', { month: 'short' }));
    }
    
    // Create a map of existing data
    const dataMap: Record<string, number> = {};
    inputData.forEach(item => {
      dataMap[item.name] = item.revenue;
    });
    
    // Ensure all months have data
    return months.map(month => ({
      name: month,
      revenue: dataMap[month] || 0
    }));
  };
  
  // In RTL mode, reverse the array order for correct display
  const completeData = ensureCompleteData(data);
  const displayData = isRTL ? [...completeData].reverse() : completeData;

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
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 10,
              }}
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
                tickFormatter={(value) => formatCurrency(value).split('.')[0]} // Remove decimals for Y-axis labels
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
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;
