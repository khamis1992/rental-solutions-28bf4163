
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import ChartTypeSelector from './revenue/ChartTypeSelector';
import RevenueChartContent from './revenue/RevenueChartContent';
import { RevenueChartProps, ChartType } from './revenue/types';

const RevenueChart: React.FC<RevenueChartProps> = ({ data, fullWidth = false }) => {
  const [chartType, setChartType] = useState<ChartType>('area');
  
  // Get current month name for dynamic title
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  
  // Calculate the total revenue for the current month
  const currentMonthData = data[data.length - 1];
  const currentMonthRevenue = currentMonthData ? currentMonthData.revenue : 0;
  
  // Calculate change from previous month
  const previousMonthData = data[data.length - 2];
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
        <ChartTypeSelector chartType={chartType} onChartTypeChange={setChartType} />
      </CardHeader>
      <CardContent>
        <div className={`${fullWidth ? 'h-96' : 'h-80'}`}>
          <RevenueChartContent data={data} chartType={chartType} />
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;
