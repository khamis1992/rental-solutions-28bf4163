import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface BarChartProps {
  data: any[];
  xAxisKey: string;
  barKeys: string[];
  barColors: string[];
  height?: number | string;
  width?: number | string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  xAxisKey,
  barKeys,
  barColors,
  height = '100%',
  width = '100%'
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width={width} height={height}>
      <RechartsBarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis 
          dataKey={xAxisKey} 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#64748b', fontSize: 12 }}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#64748b', fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        {barKeys.map((key, index) => (
          <Bar 
            key={key}
            dataKey={key} 
            fill={barColors[index % barColors.length]} 
            radius={[4, 4, 0, 0]}
            animationDuration={800}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

interface PieChartProps {
  data: any[];
  dataKey: string;
  nameKey: string;
  colors: string[];
  height?: number | string;
  width?: number | string;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  dataKey,
  nameKey,
  colors,
  height = '100%',
  width = '100%',
  innerRadius = 0,
  outerRadius = 80,
  showLegend = false
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width={width} height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          fill="#8884d8"
          dataKey={dataKey}
          nameKey={nameKey}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          animationDuration={800}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={colors[index % colors.length]} 
              stroke="#ffffff"
              strokeWidth={2}
            />
          ))}
        </Pie>
        {showLegend && <Legend />}
        <Tooltip
          formatter={(value: any) => [`${value}`, '']}
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};
