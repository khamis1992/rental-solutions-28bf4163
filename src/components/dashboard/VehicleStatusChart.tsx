import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Doughnut, DoughnutChartOptions, ChartData, ChartOptions } from 'chart.js';
import { useTheme } from 'next-themes';
import { useChart } from "@/hooks/use-chart";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/lib/supabase';

interface VehicleStatus {
  status: string;
  count: number;
}

interface ChartData {
  name: string;
  value: number;
}

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
          count,
        }));

        setVehicleStatuses(statuses);
        setTotalVehicles(data.length);
      } catch (error) {
        console.error("Error fetching vehicle statuses:", error);
      }
    };

    fetchVehicleStatuses();
  }, []);

  const chartData = useMemo<ChartData[]>(() => {
    return vehicleStatuses.map(status => ({
      name: status.status,
      value: status.count,
    }));
  }, [vehicleStatuses]);

  const { theme } = useTheme();
  const { data: chartInput } = useChart({
    type: "doughnut",
    data: {
      labels: chartData.map((item) => item.name),
      datasets: [
        {
          data: chartData.map((item) => item.value),
          backgroundColor: [
            "#065F46",
            "#10B981",
            "#34D399",
            "#A7F3D0",
            "#D1FAE5",
          ],
          borderWidth: 0,
        },
      ],
    },
    options: {
      cutout: "60%",
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: { display: false },
        y: { display: false },
      },
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Status</CardTitle>
        <CardDescription>Overview of vehicle availability</CardDescription>
      </CardHeader>
      <CardContent className="pl-2 flex flex-col items-center justify-center">
        <div className="relative w-full h-[240px] flex items-center justify-center">
          {chartInput ? (
            <Doughnut data={chartInput.data} options={chartInput.options as ChartOptions<"doughnut">} />
          ) : (
            <p>Loading chart...</p>
          )}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-2xl font-bold">{totalVehicles}</div>
            <div className="text-sm text-muted-foreground">Total Vehicles</div>
          </div>
        </div>
        <ul className="w-full space-y-2">
          {vehicleStatuses.map((status) => (
            <li key={status.status} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{status.status}</Badge>
                <span>{status.status}</span>
              </div>
              <span>{status.count}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
