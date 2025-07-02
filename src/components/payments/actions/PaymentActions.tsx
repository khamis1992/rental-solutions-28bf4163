

import { TooltipWrapper } from '@/components/ui/TooltipWrapper';
import { FileText, Plus } from 'lucide-react';

interface PaymentActionsProps {
  rentAmount: number | null;
  onRecordPaymentClick: () => void;
  onExportHistoryClick?: () => void;
}

export function PaymentActions({ rentAmount, onRecordPaymentClick, onExportHistoryClick }: PaymentActionsProps) {
  return (
    <div className="flex flex-wrap gap-2 flex-row-reverse" dir="rtl">
      <TooltipWrapper content="تسجيل دفعة جديدة لهذا العقد.">
        <Button onClick={onRecordPaymentClick}>
          <Plus className="ml-2 h-4 w-4" />
          تسجيل دفعة
        </Button>
      </TooltipWrapper>
      {onExportHistoryClick && (
        <TooltipWrapper content="تصدير سجل المدفوعات لهذا العقد.">
          <Button variant="outline" onClick={onExportHistoryClick}>
            <FileText className="ml-2 h-4 w-4" />
            تصدير السجل
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
