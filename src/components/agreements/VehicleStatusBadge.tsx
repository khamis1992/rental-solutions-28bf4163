
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Wrench, 
  HelpCircle,
  CarFront,
  ShieldAlert
} from "lucide-react";
import { verifyEnum } from '@/utils/promise/utils';

export type VehicleStatusType = 
  | 'available' 
  | 'assigned' 
  | 'maintenance' 
  | 'reserved' 
  | 'rented'
  | 'pending' 
  | 'unavailable'
  | 'stolen'
  | 'accident'
  | 'police_station'
  | 'retired'
  | string;

interface VehicleStatusBadgeProps {
  status: VehicleStatusType;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

// Common status values with their UI configuration
const STATUS_CONFIG = {
  available: {
    color: 'bg-green-500 hover:bg-green-600',
    icon: CheckCircle,
    text: 'Available'
  },
  assigned: {
    color: 'bg-blue-500 hover:bg-blue-600',
    icon: Clock,
    text: 'Assigned'
  },
  rented: {
    color: 'bg-blue-500 hover:bg-blue-600',
    icon: CarFront,
    text: 'Rented'
  },
  maintenance: {
    color: 'bg-amber-500 hover:bg-amber-600',
    icon: Wrench,
    text: 'Maintenance'
  },
  reserved: {
    color: 'bg-purple-500 hover:bg-purple-600',
    icon: Clock,
    text: 'Reserved'
  },
  pending: {
    color: 'bg-orange-500 hover:bg-orange-600',
    icon: AlertTriangle,
    text: 'Pending'
  },
  unavailable: {
    color: 'bg-red-500 hover:bg-red-600',
    icon: XCircle,
    text: 'Unavailable'
  },
  stolen: {
    color: 'bg-red-700 hover:bg-red-800',
    icon: ShieldAlert,
    text: 'Stolen'
  },
  accident: {
    color: 'bg-orange-700 hover:bg-orange-800',
    icon: AlertTriangle,
    text: 'Accident'
  },
  police_station: {
    color: 'bg-indigo-600 hover:bg-indigo-700',
    icon: ShieldAlert,
    text: 'Police Station'
  },
  retired: {
    color: 'bg-gray-500 hover:bg-gray-600',
    icon: XCircle,
    text: 'Retired'
  }
};

export const VehicleStatusBadge: React.FC<VehicleStatusBadgeProps> = ({
  status,
  className = '',
  size = 'md',
  showIcon = true
}) => {
  // Normalize the status to match known configurations
  const validStatuses = Object.keys(STATUS_CONFIG) as VehicleStatusType[];
  const normalizedStatus = verifyEnum(status?.toLowerCase(), validStatuses, 'unavailable');
  
  // Get the proper configuration for this status
  const config = normalizedStatus ? STATUS_CONFIG[normalizedStatus] : {
    color: 'bg-slate-500 hover:bg-slate-600',
    icon: HelpCircle,
    text: status || 'Unknown'
  };
  
  const { color, icon: Icon, text } = config;
  
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
