import React from 'react';
import { Button } from '@/components/ui/button';
import { TooltipWrapper } from '@/components/ui/TooltipWrapper';
import { useTranslation } from '@/utils/translation-helper';

interface MaintenanceFormActionsProps {
  isSubmitting: boolean;
  hasInitialData: boolean;
  onCancel?: () => void;
}

export function MaintenanceFormActions({ isSubmitting, hasInitialData, onCancel }: MaintenanceFormActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2">
      <TooltipWrapper content={t('maintenance.maintenanceDetails')}>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('common.loading') : t('common.save')}
        </Button>
      </TooltipWrapper>
      {hasInitialData && onCancel && (
        <TooltipWrapper content={t('common.cancel')}>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
        </TooltipWrapper>
      )}
    </div>
  );
}
