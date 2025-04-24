
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { ChartType, RevenueData } from './types';

interface RevenueChartContentProps {
  data: RevenueData[];
  chartType: ChartType;
}

const RevenueChartContent: React.FC<RevenueChartContentProps> = ({ data, chartType }) => {
  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 10 }
    };

    const commonAxisProps = {
      axisLine: false,
      tickLine: false
    };

    const commonCartesianProps = {
      strokeDasharray: "3 3",
      vertical: false,
      stroke: "#f1f5f9"
    };

    switch(chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid {...commonCartesianProps} />
            <XAxis dataKey="name" {...commonAxisProps} tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis {...commonAxisProps} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => formatCurrency(value).split('.')[0]} />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), 'Revenue']}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} animationDuration={800} />
          </BarChart>
        );
      
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid {...commonCartesianProps} />
            <XAxis dataKey="name" {...commonAxisProps} tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis {...commonAxisProps} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => formatCurrency(value).split('.')[0]} />
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
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...commonCartesianProps} />
            <XAxis dataKey="name" {...commonAxisProps} tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis {...commonAxisProps} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => formatCurrency(value).split('.')[0]} />
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
    <ResponsiveContainer width="100%" height="100%">
      {renderChart()}
    </ResponsiveContainer>
  );
};

export default RevenueChartContent;
