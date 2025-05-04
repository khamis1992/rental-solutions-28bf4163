
import React from 'react';
import { Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface PieChartProps {
  data: any[];
  nameKey: string;
  dataKey: string;
  height?: number;
  colors?: string[];
  tooltip?: boolean;
}

export function PieChart({
  data,
  nameKey,
  dataKey,
  height = 300,
  colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
  tooltip = true,
}: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        {tooltip && <Tooltip />}
        <Pie
          data={data}
          nameKey={nameKey}
          dataKey={dataKey}
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          label={(entry) => entry[nameKey]}
        >
          {data.map((_, index) => (
            <React.Fragment key={index}>
              {/* Fill with alternating colors */}
              <Cell fill={colors[index % colors.length]} />
            </React.Fragment>
          ))}
        </Pie>
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}

// Helper Cell component
const Cell = ({ fill }: { fill: string }) => {
  return <cell fill={fill} />;
};
