
import React, { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { PaymentEntryDialog } from './PaymentEntryDialog';
import { Payment } from '@/types/payment-history.types';
import { PaymentHistorySection } from '@/components/payments/PaymentHistorySection';

interface PaymentHistoryProps {
  payments: Payment[];
  isLoading: boolean;
  rentAmount: number | null;
  contractAmount: number | null;
  onPaymentDeleted: () => void;
  onPaymentUpdated: (payment: Partial<Payment>) => Promise<boolean>;
  onRecordPayment: (payment: Partial<Payment>) => void;
  leaseStartDate: string | Date | null;
  leaseEndDate: string | Date | null;
  leaseId?: string;
}

export function PaymentHistory({
  payments,
  isLoading,
  rentAmount,
  contractAmount,
  onPaymentDeleted,
  onPaymentUpdated,
  onRecordPayment,
  leaseStartDate,
  leaseEndDate,
  leaseId
}: PaymentHistoryProps) {
  // Use our PaymentHistorySection component
  // Pass showAnalytics=true to show the analytics section in this component
  return (
    <PaymentHistorySection 
      payments={payments} 
      isLoading={isLoading} 
      rentAmount={rentAmount}
      leaseId={leaseId}
      onPaymentDeleted={onPaymentDeleted}
      onRecordPayment={onRecordPayment}
      showAnalytics={true} // Show analytics in this component
    />
  );
}
