
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface EmptyPaymentStateProps {
  onRecordPayment: () => void;
}

export function EmptyPaymentState({ onRecordPayment }: EmptyPaymentStateProps) {
  return (
    <div className="text-center py-12 border rounded-md">
      <p className="text-muted-foreground">No payment history available</p>
      <p className="text-sm text-muted-foreground mt-2 mb-4">Record a payment to get started</p>
      <Button onClick={onRecordPayment}>
        <Plus className="h-4 w-4 mr-2" />
        Record Payment
      </Button>
    </div>
  );
}
