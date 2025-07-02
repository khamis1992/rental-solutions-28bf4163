

import { TooltipWrapper } from '@/components/ui/TooltipWrapper';

export interface LegalCaseFormActionsProps {
  onCancel?: () => void;
  isSubmitting: boolean;
  isEdit?: boolean;
}

export function LegalCaseFormActions({ onCancel, isSubmitting, isEdit }: LegalCaseFormActionsProps) {
  return (
    <div className="flex gap-2 flex-row-reverse" dir="rtl">
      <TooltipWrapper content={isEdit ? 'تحديث هذه القضية القانونية.' : 'إنشاء قضية قانونية جديدة.'}>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (isEdit ? 'جاري التحديث...' : 'جاري الإنشاء...') : (isEdit ? 'تحديث' : 'إنشاء')}
        </Button>
      </TooltipWrapper>
      {onCancel && (
        <TooltipWrapper content="إلغاء والعودة إلى الصفحة السابقة.">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            إلغاء
          </Button>
        </TooltipWrapper>
      )}
    </div>
  );
}
