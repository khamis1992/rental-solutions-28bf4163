
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface VehicleStatusChartProps {
  data?: {
    total: number;
    available: number;
    rented: number;
    maintenance: number;
  };
}

const VehicleStatusChart: React.FC<VehicleStatusChartProps> = ({ data }) => {
  if (!data) return null;
  
  const chartData = [
    { name: 'Available', value: data.available, color: '#22c55e' },
    { name: 'Rented', value: data.rented, color: '#3b82f6' },
    { name: 'Maintenance', value: data.maintenance, color: '#f59e0b' },
  ];

  return (
    <Card className="col-span-1 card-transition">
      <CardHeader className="pb-0">
        <CardTitle>Vehicle Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 flex flex-col items-center justify-center">
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
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
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                iconSize={10}
                formatter={(value, entry, index) => {
                  return (
                    <span className="text-sm">{value}</span>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-sm text-center text-muted-foreground mt-2">
            Total Fleet: {data.total} vehicles
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleStatusChart;
