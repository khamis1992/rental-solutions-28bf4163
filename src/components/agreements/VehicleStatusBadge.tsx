
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

export type VehicleStatusType = 
  | 'available' 
  | 'assigned' 
  | 'maintenance' 
  | 'reserved' 
  | 'pending' 
  | 'unavailable' 
  | string;

interface VehicleStatusBadgeProps {
  status: VehicleStatusType;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const VehicleStatusBadge = ({
  status,
  className = '',
  size = 'md',
  showIcon = true
}: VehicleStatusBadgeProps) => {
  const getStatusConfig = (status: VehicleStatusType) => {
    const lowerStatus = status.toLowerCase();
    
    switch(lowerStatus) {
      case 'available':
        return {
          variant: 'success' as const,
          icon: CheckCircle,
          text: 'Available'
        };
      case 'assigned':
        return {
          variant: 'default' as const,
          icon: Clock,
          text: 'Assigned'
        };
      case 'maintenance':
        return {
          variant: 'warning' as const,
          icon: Wrench,
          text: 'Maintenance'
        };
      case 'reserved':
        return {
          variant: 'secondary' as const,
          icon: Clock,
          text: 'Reserved'
        };
      case 'pending':
        return {
          variant: 'warning' as const,
          icon: AlertTriangle,
          text: 'Pending'
        };
      case 'unavailable':
        return {
          variant: 'destructive' as const,
          icon: XCircle,
          text: 'Unavailable'
        };
      default:
        return {
          variant: 'outline' as const,
          icon: HelpCircle,
          text: status
        };
    }
  };
  
  const { variant, icon: Icon, text } = getStatusConfig(status);
  
  const sizeClasses = {
    'sm': 'text-xs py-0.5 px-1.5',
    'md': 'text-xs py-1 px-2',
    'lg': 'text-sm py-1 px-2.5'
  }[size];
  
  return (
    <Badge variant={variant} className={`${sizeClasses} ${className} flex items-center justify-center`}>
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {text}
    </Badge>
  );
};
