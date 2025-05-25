
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/lib/supabase';

interface VehicleStatus {
  status: string;
  count: number;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

const STATUS_COLORS = [
  "#065F46", // Dark green
  "#10B981", // Green
  "#34D399", // Light green
  "#A7F3D0", // Lighter green
  "#D1FAE5", // Very light green
  "#6366F1", // Indigo
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
];

export function VehicleStatusChart() {
  const [vehicleStatuses, setVehicleStatuses] = useState<VehicleStatus[]>([]);
  const [totalVehicles, setTotalVehicles] = useState<number>(0);

  useEffect(() => {
    const fetchVehicleStatuses = async () => {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('status');

        if (error) {
          console.error("Error fetching vehicle statuses:", error);
          return;
        }

        const statusCounts = data.reduce((acc: { [key: string]: number }, vehicle) => {
          const status = vehicle.status || 'unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        const statuses: VehicleStatus[] = Object.entries(statusCounts).map(([status, count]) => ({
          status,
          count: count as number,
        }));

        setVehicleStatuses(statuses);
        setTotalVehicles(data.length);
      } catch (error) {
        console.error("Error fetching vehicle statuses:", error);
      }
    };

    fetchVehicleStatuses();
  }, []);

  const chartData: ChartData[] = vehicleStatuses.map((status, index) => ({
    name: status.status,
    value: status.count,
    color: STATUS_COLORS[index % STATUS_COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Status</CardTitle>
        <CardDescription>Overview of vehicle availability</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative w-full h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-2xl font-bold">{totalVehicles}</div>
              <div className="text-sm text-muted-foreground">Total Vehicles</div>
            </div>
          </div>
          
          <div className="w-full space-y-2">
            {vehicleStatuses.map((status, index) => (
              <div key={status.status} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: STATUS_COLORS[index % STATUS_COLORS.length] }}
                  />
                  <Badge variant="secondary">{status.status}</Badge>
                  <span className="capitalize">{status.status.replace('_', ' ')}</span>
                </div>
                <span className="font-medium">{status.count}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
