
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, FileDown, Filter } from 'lucide-react';

interface PaymentActionsProps {
  rentAmount: number | null;
  onRecordPaymentClick: () => void;
}

export function PaymentActions({ rentAmount, onRecordPaymentClick }: PaymentActionsProps) {
  return (
    <div className="flex justify-between mb-4">
      <div className="flex items-center text-sm font-medium">
        {rentAmount && <span className="text-muted-foreground">Monthly Rent: QAR {rentAmount}</span>}
      </div>
      <Button onClick={onRecordPaymentClick}>
        <Plus className="h-4 w-4 mr-2" />
        Record Payment
      </Button>
    </div>
  );
}

export function PaymentTableActions() {
  return (
    <div className="flex justify-between mt-4">
      <Button variant="outline" size="sm">
        <FileDown className="h-4 w-4 mr-2" />
        Export History
      </Button>
      <Button variant="outline" size="sm">
        <Filter className="h-4 w-4 mr-2" />
        Filter
      </Button>
    </div>
  );
}
