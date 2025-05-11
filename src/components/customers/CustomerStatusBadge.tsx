
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  HelpCircle 
} from "lucide-react";

export type CustomerStatusType = 
  | 'active' 
  | 'inactive' 
  | 'pending_review' 
  | 'pending_payment' 
  | 'blacklisted' 
  | string;

interface CustomerStatusBadgeProps {
  status: CustomerStatusType;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const CustomerStatusBadge: React.FC<CustomerStatusBadgeProps> = ({
  status,
  className = '',
  size = 'md',
  showIcon = true
}) => {
  const getStatusConfig = (status: CustomerStatusType) => {
    const lowerStatus = typeof status === 'string' ? status.toLowerCase() : '';
    
    switch(lowerStatus) {
      case 'active':
        return {
          variant: 'success',
          icon: CheckCircle,
          text: 'Active'
        };
      case 'inactive':
        return {
          variant: 'inactive',
          icon: XCircle,
          text: 'Inactive'
        };
      case 'pending_review':
        return {
          variant: 'warning',
          icon: AlertTriangle,
          text: 'Pending Review'
        };
      case 'pending_payment':
        return {
          variant: 'info',
          icon: Clock,
          text: 'Pending Payment'
        };
      case 'blacklisted':
        return {
          variant: 'destructive',
          icon: XCircle,
          text: 'Blacklisted'
        };
      default:
        return {
          variant: 'default',
          icon: HelpCircle,
          text: status || 'Unknown'
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
    <Badge 
      variant={variant as any} 
      className={`${sizeClasses} ${className} flex items-center gap-1`}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {text}
    </Badge>
  );
};
