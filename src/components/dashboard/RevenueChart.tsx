
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import ChartTypeSelector from './revenue/ChartTypeSelector';
import RevenueChartContent from './revenue/RevenueChartContent';
import { RevenueChartProps, ChartType } from './revenue/types';
import { TrendingDown, TrendingUp } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  const ChangeIcon = revenueChange >= 0 ? TrendingUp : TrendingDown;

  return (
    <Card className="border-blue-100 overflow-hidden bg-white">
      <CardHeader className="pb-0 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-gradient-to-r from-slate-50 to-gray-50 border-b border-blue-100">
        <div className="mb-3 sm:mb-0">
          <CardTitle className="text-lg font-semibold">Revenue Overview</CardTitle>
          <div className="flex items-center mt-1">
            <span className="text-lg font-semibold">{formatCurrency(currentMonthRevenue)}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={`text-sm ml-2 ${changeColor} flex items-center px-2 py-0.5 rounded-full bg-opacity-20 ${revenueChange >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <ChangeIcon className="h-3 w-3 mr-1" />
                    {formattedChange}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Compared to {previousMonthData?.name || 'previous month'}: {formatCurrency(previousMonthRevenue)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Last 6 Months</span>
          <ChartTypeSelector chartType={chartType} onChartTypeChange={setChartType} />
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className={`${fullWidth ? 'h-96' : 'h-80'}`}>
          <RevenueChartContent data={data} chartType={chartType} />
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;
