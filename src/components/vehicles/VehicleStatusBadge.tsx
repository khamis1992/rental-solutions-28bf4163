
import React from 'react';
import { Badge } from '@/components/ui/badge';

type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'sold' | 'inactive' | string;

interface VehicleStatusBadgeProps {
  status: VehicleStatus;
  className?: string;
}

export const VehicleStatusBadge: React.FC<VehicleStatusBadgeProps> = ({ status, className = '' }) => {
  // Map status to appropriate badge variant
  const getVariant = () => {
    switch (status) {
      case 'available':
        return 'success';
      case 'rented':
        return 'secondary';
      case 'maintenance':
        return 'warning';
      case 'sold':
        return 'default';
      case 'inactive':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <Badge variant={getVariant()} className={className}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};
