import React from 'react';
import { Badge } from '@/components/ui/badge';

interface ExpenseStatusBadgeProps {
  status: string;
}

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  paid: 'default',
  pending: 'secondary',
  overdue: 'destructive',
  unknown: 'outline',
};

const ExpenseStatusBadge: React.FC<ExpenseStatusBadgeProps> = ({ status }) => {
  const variant = statusVariants[status] || 'outline';
  return (
    <Badge variant={variant}>{status}</Badge>
  );
};

export default React.memo(ExpenseStatusBadge);
