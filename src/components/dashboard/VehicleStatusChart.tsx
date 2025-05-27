
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Progress } from "@/components/ui/progress";
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

const STATUS_COLORS = {
  available: "#10B981",
  rented: "#3B82F6", 
  maintenance: "#F59E0B",
  police_station: "#EF4444",
  accident: "#DC2626",
  stolen: "#991B1B",
  reserved: "#8B5CF6",
  attention: "#F97316",
  critical: "#BE185D"
};

export function VehicleStatusChart() {
  const [vehicleStatuses, setVehicleStatuses] = useState<VehicleStatus[]>([]);
  const [totalVehicles, setTotalVehicles] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVehicleStatuses = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('vehicles')
          .select('status');

        if (error) {
          console.error("Error fetching vehicle statuses:", error);
          return;
        }

        if (!data) {
          console.log("No vehicle data found");
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicleStatuses();
  }, []);

  const chartData = useMemo<ChartData[]>(() => {
    return vehicleStatuses.map(status => ({
      name: status.status,
      value: status.count,
      color: STATUS_COLORS[status.status as keyof typeof STATUS_COLORS] || "#6B7280"
    }));
  }, [vehicleStatuses]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Status</CardTitle>
          <CardDescription>Loading vehicle status data...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Status</CardTitle>
        <CardDescription>Overview of vehicle availability</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="flex flex-col lg:flex-row items-center space-y-4 lg:space-y-0 lg:space-x-6">
          <div className="relative w-full lg:w-1/2 h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
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
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No vehicle data available
              </div>
            )}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-2xl font-bold">{totalVehicles}</div>
              <div className="text-sm text-muted-foreground">Total Vehicles</div>
            </div>
          </div>
          
          <div className="w-full lg:w-1/2">
            <div className="space-y-3">
              {vehicleStatuses.map((status) => (
                <div key={status.status} className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ 
                        backgroundColor: STATUS_COLORS[status.status as keyof typeof STATUS_COLORS] || "#6B7280" 
                      }}
                    />
                    <Badge variant="secondary" className="capitalize">
                      {status.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{status.count}</span>
                    <span className="text-sm text-muted-foreground">
                      ({totalVehicles > 0 ? Math.round((status.count / totalVehicles) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
