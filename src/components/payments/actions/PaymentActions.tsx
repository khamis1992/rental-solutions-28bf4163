import React from 'react';
import { Button } from '@/components/ui/button';
import { TooltipWrapper } from '@/components/ui/TooltipWrapper';
import { FileText, Plus } from 'lucide-react';

interface PaymentActionsProps {
  rentAmount: number | null;
  onRecordPaymentClick: () => void;
  onExportHistoryClick?: () => void;
}

export function PaymentActions({ rentAmount, onRecordPaymentClick, onExportHistoryClick }: PaymentActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <TooltipWrapper content="Record a new payment for this agreement.">
        <Button onClick={onRecordPaymentClick}>
          <Plus className="mr-2 h-4 w-4" />
          Record Payment
        </Button>
      </TooltipWrapper>
      {onExportHistoryClick && (
        <TooltipWrapper content="Export the payment history for this agreement.">
          <Button variant="outline" onClick={onExportHistoryClick}>
            <FileText className="mr-2 h-4 w-4" />
            Export History
          </Button>
        </TooltipWrapper>
      )}
    </div>
  );
}

// The PaymentTableActions component is now only used for additional actions that might be needed at the bottom of the table
export function PaymentTableActions() {
  return (
    <div className="mt-4 flex justify-between">
      <div className="text-sm text-muted-foreground">
        {/* This area can be used for pagination, bulk actions, etc. in the future */}
      </div>
    </div>
  );
}
