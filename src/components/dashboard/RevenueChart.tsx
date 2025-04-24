
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BarChart3, LineChart as LineChartIcon, AreaChart as AreaChartIcon } from 'lucide-react';

interface RevenueChartProps {
  data: { name: string; revenue: number }[];
  fullWidth?: boolean;
}

type ChartType = 'area' | 'bar' | 'line';

const RevenueChart: React.FC<RevenueChartProps> = ({ data, fullWidth = false }) => {
  const [chartType, setChartType] = useState<ChartType>('area');
  
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
  
  const completeData = ensureCompleteData(data);
  
  // Calculate the total revenue for the current month
  const currentMonthData = completeData[completeData.length - 1];
  const currentMonthRevenue = currentMonthData ? currentMonthData.revenue : 0;
  
  // Calculate change from previous month
  const previousMonthData = completeData[completeData.length - 2];
  const previousMonthRevenue = previousMonthData ? previousMonthData.revenue : 0;
  const revenueChange = previousMonthRevenue !== 0 
    ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
    : 0;
  
  // Format the change indicator
  const formattedChange = revenueChange !== 0 
    ? `${revenueChange > 0 ? '+' : ''}${revenueChange.toFixed(1)}%` 
    : 'No change';
  
  // Determine color based on change direction
  const changeColor = revenueChange > 0 
    ? 'text-green-600' 
    : revenueChange < 0 
      ? 'text-red-600' 
      : 'text-gray-600';

  const renderChart = () => {
    switch(chartType) {
      case 'bar':
        return (
          <BarChart
            data={completeData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 10,
            }}
          >
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
              tickFormatter={(value) => formatCurrency(value).split('.')[0]}
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
            <Bar 
              dataKey="revenue" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]}
              animationDuration={800}
            />
          </BarChart>
        );
      
      case 'line':
        return (
          <LineChart
            data={completeData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 10,
            }}
          >
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
              tickFormatter={(value) => formatCurrency(value).split('.')[0]}
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
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ stroke: '#3b82f6', strokeWidth: 2, fill: 'white', r: 4 }}
              activeDot={{ stroke: '#3b82f6', strokeWidth: 2, fill: '#3b82f6', r: 6 }}
              animationDuration={800}
            />
          </LineChart>
        );
      
      default: // area chart
        return (
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
              tickFormatter={(value) => formatCurrency(value).split('.')[0]}
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
              animationDuration={800}
            />
          </AreaChart>
        );
    }
  };

  return (
    <Card className={`card-transition dashboard-card ${fullWidth ? 'col-span-full' : 'col-span-3'}`}>
      <CardHeader className="pb-0 flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div className="mb-3 sm:mb-0">
          <CardTitle>{`${currentMonth} Revenue Overview`}</CardTitle>
          <div className="flex items-center mt-1">
            <span className="text-lg font-semibold">{formatCurrency(currentMonthRevenue)}</span>
            <span className={`text-sm ml-2 ${changeColor}`}>{formattedChange}</span>
          </div>
        </div>
        <div className="flex space-x-1">
          <Button 
            variant={chartType === 'area' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setChartType('area')}
            className="h-8"
          >
            <AreaChartIcon className="h-4 w-4" />
          </Button>
          <Button 
            variant={chartType === 'bar' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setChartType('bar')}
            className="h-8"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button 
            variant={chartType === 'line' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setChartType('line')}
            className="h-8"
          >
            <LineChartIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`${fullWidth ? 'h-96' : 'h-80'}`}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;
