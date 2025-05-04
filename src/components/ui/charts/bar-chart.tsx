
import React from 'react';
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface BarChartProps {
  data: any[];
  xKey: string;
  yKey: string;
  height?: number;
  color?: string;
  tooltip?: boolean;
}

export function BarChart({
  data,
  xKey,
  yKey,
  height = 300,
  color = "#3B82F6",
  tooltip = true,
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data}>
        <XAxis dataKey={xKey} />
        <YAxis />
        {tooltip && <Tooltip />}
        <Bar dataKey={yKey} fill={color} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
