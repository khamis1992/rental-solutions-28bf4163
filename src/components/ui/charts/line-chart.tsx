
import React from 'react';
import { Line, LineChart as RechartsLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface LineChartProps {
  data: any[];
  xKey: string;
  yKey: string;
  height?: number;
  color?: string;
  tooltip?: boolean;
}

export function LineChart({
  data,
  xKey,
  yKey,
  height = 300,
  color = "#3B82F6",
  tooltip = true,
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data}>
        <XAxis dataKey={xKey} />
        <YAxis />
        {tooltip && <Tooltip />}
        <Line type="monotone" dataKey={yKey} stroke={color} />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
