
import React from 'react';
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Wrench,
  HelpCircle
} from "lucide-react";

interface VehicleStatusChartProps {
  availableCount: number;
  assignedCount: number;
  maintenanceCount: number;
  reservedCount: number;
  pendingCount: number;
  unavailableCount: number;
}

export const VehicleStatusChart: React.FC<VehicleStatusChartProps> = ({
  availableCount,
  assignedCount,
  maintenanceCount,
  reservedCount,
  pendingCount,
  unavailableCount,
}) => {
  const data = {
    labels: [
      'Available',
      'Assigned',
      'Maintenance',
      'Reserved',
      'Pending',
      'Unavailable',
    ],
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
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)',   // Available (Green)
          'rgba(54, 162, 235, 0.8)',   // Assigned (Blue)
          'rgba(255, 206, 86, 0.8)',   // Maintenance (Yellow)
          'rgba(153, 102, 255, 0.8)',  // Reserved (Purple)
          'rgba(255, 159, 64, 0.8)',   // Pending (Orange)
          'rgba(255, 99, 132, 0.8)',    // Unavailable (Red)
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255, 99, 132, 1)',
        ],
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

  // Simplified implementation without chart.js and react-chartjs-2 dependency
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="w-full h-64 md:h-80 relative bg-gray-50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <h4 className="text-lg font-semibold">Vehicle Status Distribution</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
            {[
              { label: 'Available', count: availableCount, color: 'bg-emerald-400' },
              { label: 'Assigned', count: assignedCount, color: 'bg-blue-400' },
              { label: 'Maintenance', count: maintenanceCount, color: 'bg-yellow-400' },
              { label: 'Reserved', count: reservedCount, color: 'bg-purple-400' },
              { label: 'Pending', count: pendingCount, color: 'bg-orange-400' },
              { label: 'Unavailable', count: unavailableCount, color: 'bg-red-400' },
            ].map(item => (
              <div key={item.label} className="flex items-center p-2 rounded border">
                <div className={`${item.color} w-3 h-3 rounded-full mr-2`}></div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-600">{item.label}</span>
                  <span className="font-medium">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 w-full">
        <h3 className="text-sm font-medium text-gray-700">Vehicle Status</h3>
        <div className="flex flex-wrap justify-center mt-2">
          {data.labels.map((label, index) => {
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
