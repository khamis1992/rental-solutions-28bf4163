
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PaymentHistoryProps {
  agreementId?: string;
  onPaymentDeleted?: () => void;
}

export function PaymentHistory({ agreementId, onPaymentDeleted }: PaymentHistoryProps) {
  return (
    <Alert>
      <AlertDescription className="text-center py-4">
        No payments recorded for this agreement yet.
      </AlertDescription>
    </Alert>
  );
}
