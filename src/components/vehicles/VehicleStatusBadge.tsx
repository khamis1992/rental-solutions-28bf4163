
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { VehicleStatus } from '@/types/vehicle';
import { cn } from '@/lib/utils';

interface VehicleStatusBadgeProps {
  status: VehicleStatus;
  className?: string;
}

export function VehicleStatusBadge({ status, className }: VehicleStatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'rented':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'reserved':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'maintenance':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      case 'accident':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'stolen':
        return 'bg-red-200 text-red-900 hover:bg-red-300';
      case 'police_station':
        return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200';
      case 'retired':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default:
        return 'bg-slate-100 text-slate-800 hover:bg-slate-200';
    }
  };

  const getDisplayText = () => {
    switch (status) {
      case 'police_station':
        return 'Police Station';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <Badge
      className={cn('font-medium', getStatusStyles(), className)}
      variant="outline"
    >
      {getDisplayText()}
    </Badge>
  );
}
