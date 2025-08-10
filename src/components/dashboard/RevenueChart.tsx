// @ts-nocheck
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import ChartTypeSelector from './revenue/ChartTypeSelector';
import RevenueChartContent from './revenue/RevenueChartContent';
import { RevenueChartProps, ChartType } from './revenue/types';
import { useLanguage } from '@/contexts/LanguageContext';

const RevenueChart: React.FC<RevenueChartProps> = ({ data, fullWidth = false }) => {
  const [chartType, setChartType] = useState<ChartType>('area');
  const { language } = useLanguage();
  
  // Get current month name in Arabic (Gregorian calendar only)
  const getCurrentMonthInArabic = () => {
    const date = new Date();
    
    // Arabic Gregorian month names
    const arabicGregorianMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    
    if (language === 'ar') {
      return arabicGregorianMonths[date.getMonth()];
    }
    
    return date.toLocaleDateString('en-US', { month: 'long' });
  };
  
  const currentMonth = getCurrentMonthInArabic();
  
  // Calculate the total revenue for the current month
  const currentMonthData = data[data.length - 1];
  const currentMonthRevenue = currentMonthData ? currentMonthData.revenue : 0;
  
  // Calculate change from previous month
  const previousMonthData = data[data.length - 2];
  const previousMonthRevenue = previousMonthData ? previousMonthData.revenue : 0;
  const revenueChange = previousMonthRevenue !== 0 
    ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
    : 0;
  
  // Format the change indicator in Arabic
  const formattedChange = revenueChange !== 0 
    ? `${revenueChange > 0 ? '+' : ''}${revenueChange.toFixed(1)}%` 
    : 'لا يوجد تغيير';
  
  // Determine color based on change direction
  const changeColor = revenueChange > 0 
    ? 'text-green-600' 
    : revenueChange < 0 
      ? 'text-red-600' 
      : 'text-gray-600';

  // Format currency with English digits but Arabic QAR symbol
  const formatCurrencyArabic = (amount: number) => {
    return `${amount.toLocaleString('en-US')} ر.ق`;
  };

  return (
    <Card className={`card-transition dashboard-card ${fullWidth ? 'col-span-full' : 'col-span-3'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-0 flex flex-col sm:flex-row sm:justify-between sm:items-center flex-row-reverse">
        <ChartTypeSelector chartType={chartType} onChartTypeChange={setChartType} />
        <div className="mb-3 sm:mb-0 text-right">
          <CardTitle>نظرة عامة على إيرادات {currentMonth}</CardTitle>
          <div className="flex items-center mt-1 flex-row-reverse">
            <span className={`text-sm mr-2 ${changeColor}`}>{formattedChange}</span>
            <span className="text-lg font-semibold">{formatCurrencyArabic(currentMonthRevenue)}</span>
          </div>
        </div>
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
