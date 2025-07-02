

import { Plus } from 'lucide-react';

interface EmptyPaymentStateProps {
  onRecordPayment: () => void;
}

export function EmptyPaymentState({ onRecordPayment }: EmptyPaymentStateProps) {
  return (
    <div className="text-center py-12 border rounded-md" dir="rtl">
      <p className="text-muted-foreground">لا يتوفر سجل مدفوعات</p>
      <p className="text-sm text-muted-foreground mt-2 mb-4">سجل دفعة للبدء</p>
      <Button onClick={onRecordPayment} className="flex-row-reverse">
        <Plus className="h-4 w-4 ml-2" />
        تسجيل دفعة
      </Button>
    </div>
  );
} 