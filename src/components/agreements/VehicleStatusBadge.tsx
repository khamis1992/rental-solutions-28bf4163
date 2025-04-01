
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

export const VehicleStatusBadge: React.FC<VehicleStatusBadgeProps> = ({
  status,
  className = '',
  size = 'md',
  showIcon = true
}) => {
  const getStatusConfig = (status: VehicleStatusType) => {
    const lowerStatus = status.toLowerCase();
    
    switch(lowerStatus) {
      case 'available':
        return {
          color: 'bg-green-500 hover:bg-green-600',
          icon: CheckCircle,
          text: 'Available'
        };
      case 'assigned':
        return {
          color: 'bg-blue-500 hover:bg-blue-600',
          icon: Clock,
          text: 'Assigned'
        };
      case 'maintenance':
        return {
          color: 'bg-amber-500 hover:bg-amber-600',
          icon: Wrench,
          text: 'Maintenance'
        };
      case 'reserved':
        return {
          color: 'bg-purple-500 hover:bg-purple-600',
          icon: Clock,
          text: 'Reserved'
        };
      case 'pending':
        return {
          color: 'bg-orange-500 hover:bg-orange-600',
          icon: AlertTriangle,
          text: 'Pending'
        };
      case 'unavailable':
        return {
          color: 'bg-red-500 hover:bg-red-600',
          icon: XCircle,
          text: 'Unavailable'
        };
      default:
        return {
          color: 'bg-slate-500 hover:bg-slate-600',
          icon: HelpCircle,
          text: status
        };
    }
  };
  
  const { color, icon: Icon, text } = getStatusConfig(status);
  
  const sizeClasses = {
    'sm': 'text-xs py-0.5 px-1.5',
    'md': 'text-xs py-1 px-2',
    'lg': 'text-sm py-1 px-2.5'
  }[size];
  
  return (
    <Badge className={`${color} ${sizeClasses} ${className} flex items-center justify-center`}>
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {text}
    </Badge>
  );
};
