
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface RevenueChartProps {
  data: { name: string; revenue: number }[];
  fullWidth?: boolean;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, fullWidth = false }) => {
  // Get current month name for dynamic title
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  
  // Memoize data processing to avoid unnecessary recalculations
  const completeData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // List of expected months (last 6 months)
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(month.toLocaleString('default', { month: 'short' }));
    }
    
    // Create a map of existing data
    const dataMap: Record<string, number> = {};
    data.forEach(item => {
      dataMap[item.name] = item.revenue;
    });
    
    // Ensure all months have data
    return months.map(month => ({
      name: month,
      revenue: dataMap[month] || 0
    }));
  }, [data]);

  return (
    <Card className={`card-transition ${fullWidth ? 'col-span-full' : 'col-span-3'}`}>
      <CardHeader className="pb-0">
        <CardTitle>{`${currentMonth} Revenue Overview`}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`${fullWidth ? 'h-96' : 'h-80'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={completeData}
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
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value).split('.')[0]} // Remove decimals for Y-axis labels
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
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
