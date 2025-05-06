
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface VehicleStatusBadgeProps {
  status?: string;
  className?: string;
}

export const VehicleStatusBadge: React.FC<VehicleStatusBadgeProps> = ({ status, className }) => {
  const variant = getVariant(status);
  const label = getLabel(status);
  
  return (
    <Badge 
      variant={variant} 
      className={cn("capitalize", className)}
    >
      {label}
    </Badge>
  );
};

function getVariant(status?: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" {
  if (!status) return "outline";
  
  switch (status.toLowerCase()) {
    case 'available':
      return 'success';
    case 'rented':
      return 'default';
    case 'maintenance':
      return 'warning';
    case 'sold':
      return 'secondary';
    case 'inactive':
      return 'outline';
    case 'reserved':
    case 'reserve':
      return 'secondary';
    case 'pending':
      return 'warning';
    default:
      return 'outline';
  }
}

function getLabel(status?: string): string {
  if (!status) return "Unknown";
  
  switch (status.toLowerCase()) {
    case 'reserve':
      return 'Reserved';
    default:
      return status;
  }
}
