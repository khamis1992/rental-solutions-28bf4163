
import React from 'react';
import { Area, AreaChart as RechartsAreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface AreaChartProps {
  data: any[];
  xKey: string;
  yKey: string;
  height?: number;
  color?: string;
  tooltip?: boolean;
}

export function AreaChart({
  data,
  xKey,
  yKey,
  height = 300,
  color = "#3B82F6",
  tooltip = true,
}: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data}>
        <XAxis dataKey={xKey} />
        <YAxis />
        {tooltip && <Tooltip />}
        <Area type="monotone" dataKey={yKey} stroke={color} fill={color} fillOpacity={0.1} />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
