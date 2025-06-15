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
          variant: 'success' as const,
          icon: CheckCircle,
          text: 'نشط'
        };
      case 'inactive':
        return {
          variant: 'outline' as const,
          icon: XCircle,
          text: 'غير نشط'
        };
      case 'pending_review':
        return {
          variant: 'warning' as const,
          icon: AlertTriangle,
          text: 'قيد المراجعة'
        };
      case 'pending_payment':
        return {
          variant: 'secondary' as const,
          icon: Clock,
          text: 'في انتظار الدفع'
        };
      case 'blacklisted':
        return {
          variant: 'destructive' as const,
          icon: XCircle,
          text: 'محظور'
        };
      default:
        return {
          variant: 'default' as const,
          icon: HelpCircle,
          text: status || 'غير معروف'
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
      variant={variant}
      className={`${sizeClasses} ${className} flex items-center gap-1`}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {text}
    </Badge>
  );
};
