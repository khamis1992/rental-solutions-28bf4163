import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
  Plugin,
} from 'chart.js';
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Wrench,
  HelpCircle
} from "lucide-react";

ChartJS.register(ArcElement, Tooltip, Legend);

interface VehicleStatusChartProps {
  availableCount: number;
  assignedCount: number;
  maintenanceCount: number;
  reservedCount: number;
  pendingCount: number;
  unavailableCount: number;
}

const backgroundColors = [
  'rgba(75, 192, 192, 0.8)',   // Available (Green)
  'rgba(54, 162, 235, 0.8)',   // Assigned (Blue)
  'rgba(255, 206, 86, 0.8)',   // Maintenance (Yellow)
  'rgba(153, 102, 255, 0.8)',  // Reserved (Purple)
  'rgba(255, 159, 64, 0.8)',   // Pending (Orange)
  'rgba(255, 99, 132, 0.8)',    // Unavailable (Red)
];

const borderColors = [
  'rgba(75, 192, 192, 1)',
  'rgba(54, 162, 235, 1)',
  'rgba(255, 206, 86, 1)',
  'rgba(153, 102, 255, 1)',
  'rgba(255, 159, 64, 1)',
  'rgba(255, 99, 132, 1)',
];

const statusLabels = [
  'Available',
  'Assigned',
  'Maintenance',
  'Reserved',
  'Pending',
  'Unavailable',
];

export const VehicleStatusChart: React.FC<VehicleStatusChartProps> = ({
  availableCount,
  assignedCount,
  maintenanceCount,
  reservedCount,
  pendingCount,
  unavailableCount,
}) => {
  const data = {
    labels: statusLabels,
    datasets: [
      {
        label: 'Vehicle Status',
        data: [
          availableCount,
          assignedCount,
          maintenanceCount,
          reservedCount,
          pendingCount,
          unavailableCount,
        ],
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
      },
    ],
  };

  const totalVehicles =
    availableCount +
    assignedCount +
    maintenanceCount +
    reservedCount +
    pendingCount +
    unavailableCount;

  const getStatusIcon = (label: string) => {
    switch (label) {
      case 'Available':
        return CheckCircle;
      case 'Assigned':
        return Clock;
      case 'Maintenance':
        return Wrench;
      case 'Reserved':
        return Clock;
      case 'Pending':
        return AlertTriangle;
      case 'Unavailable':
        return XCircle;
      default:
        return HelpCircle;
    }
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
        position: 'right',
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const percentage = totalVehicles > 0 ? ((value / totalVehicles) * 100).toFixed(2) + '%' : '0.00%';
            return `${label}: ${value} (${percentage})`;
          },
        },
      },
    },
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="w-full h-64 md:h-80 relative">
        <Doughnut data={data} options={options} />
      </div>
      <div className="mt-4 w-full">
        <h3 className="text-sm font-medium text-gray-700">Vehicle Status</h3>
        <div className="flex flex-wrap justify-center mt-2">
          {statusLabels.map((label, index) => {
            const count = data.datasets[0].data[index] as number;
            if (count === 0) return null;
            const Icon = getStatusIcon(label);
            return (
              <div key={label} className="flex items-center mx-2 my-1">
                <Icon className="h-4 w-4 mr-1 text-gray-500" />
                <span className="text-gray-600 text-xs">{label}</span>
                {label === 'Pending' ? (
                  <Badge variant="destructive" className="ms-2">{pendingCount}</Badge>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
