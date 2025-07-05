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
  // For better readability with Arabic text, we'll disable labels 
  // and rely on the status list and tooltips instead
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={false} // Disable labels to prevent overlap and confusion
          innerRadius={chartType === 'donut' ? 85 : 0}
          outerRadius={120}
          paddingAngle={3}
          dataKey="value"
          onClick={onSegmentClick}
          cursor="pointer"
          animationDuration={800}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color} 
              stroke="#ffffff" 
              strokeWidth={3}
            />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value, name) => [`${value} مركبة`, name]}
          labelStyle={{ 
            direction: 'rtl', 
            textAlign: 'right',
            fontFamily: 'inherit',
            fontSize: '14px',
            fontWeight: '500'
          }}
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            direction: 'rtl',
            textAlign: 'right',
            fontFamily: 'inherit',
            padding: '12px 16px'
          }}
          wrapperStyle={{
            direction: 'rtl'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};
