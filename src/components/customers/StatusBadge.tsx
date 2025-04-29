import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
}

const statusVariants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: React.ElementType }> = {
  active: { variant: "default", icon: CheckCircle },
  inactive: { variant: "secondary", icon: XCircle },
  blacklisted: { variant: "destructive", icon: XCircle },
  pending_review: { variant: "outline", icon: AlertTriangle },
  pending_payment: { variant: "outline", icon: AlertTriangle },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { variant, icon: Icon } = statusVariants[status] || statusVariants.active;
  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {status.replace('_', ' ')}
    </Badge>
  );
};

export default React.memo(StatusBadge);
