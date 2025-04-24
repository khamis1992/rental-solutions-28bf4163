
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { StatusConfig } from './types';

interface StatusChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
    key: string;
    filterValue: string;
  }>;
  chartType: 'pie' | 'donut';
  onSegmentClick: (data: any) => void;
}

export const StatusChart: React.FC<StatusChartProps> = ({
  data,
  chartType,
  onSegmentClick
}) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={chartType === 'donut' ? 90 : 0}
          outerRadius={130}
          paddingAngle={4}
          dataKey="value"
          label={({ name, value }) => `${name}: ${value}`}
          labelLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
          onClick={onSegmentClick}
          cursor="pointer"
          animationDuration={800}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color} 
              stroke="#ffffff" 
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => [`${value} vehicles`, '']}
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};
