
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface RevenueChartProps {
  data: { name: string; revenue: number }[];
  fullWidth?: boolean;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, fullWidth = false }) => {
  // Get current month and year for the title
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  
  // Handle the case of a single month's data
  const ensureCompleteData = (inputData: { name: string; revenue: number }[]) => {
    if (!inputData || inputData.length === 0) {
      // Return current month with zero revenue if no data
      return [{
        name: currentDate.toLocaleString('default', { month: 'short' }),
        revenue: 0
      }];
    }
    
    return inputData;
  };
  
  const completeData = ensureCompleteData(data);

  return (
    <Card className={`card-transition ${fullWidth ? 'col-span-full' : 'col-span-3'}`}>
      <CardHeader className="pb-0">
        <CardTitle>Revenue - {currentMonth} {currentYear}</CardTitle>
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
